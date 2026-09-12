import { createServiceClient } from "@/lib/supabase/admin";
import { DELETED_USERNAME_RE } from "@/lib/usernames";

export async function allocateDeletedUsername(original: string) {
  const admin = createServiceClient();
  const base = (original || "user").replace(DELETED_USERNAME_RE, "").slice(0, 24) || "user";
  let candidate = `${base}_del`;
  for (let i = 0; i < 30; i += 1) {
    const { data } = await admin.from("profiles").select("id").eq("username", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}_del${i + 2}`;
  }
  return `${base}_del${Date.now().toString().slice(-4)}`;
}

export async function softDeleteAccount(opts: {
  userId: string;
  reason?: string | null;
}) {
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, original_username, account_status")
    .eq("id", opts.userId)
    .maybeSingle();
  if (!profile) throw new Error("Account not found");
  if (profile.account_status === "deleted") {
    return { username: profile.username as string, original: profile.original_username || profile.username };
  }

  const original = (profile.original_username || profile.username) as string;
  const reserved = await allocateDeletedUsername(original);
  const now = new Date();
  const deleteAfter = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const { error } = await admin
    .from("profiles")
    .update({
      username: reserved,
      original_username: original,
      account_status: "deleted",
      is_public: false,
      deleted_at: now.toISOString(),
      delete_after: deleteAfter.toISOString(),
    })
    .eq("id", opts.userId);
  if (error) throw new Error(error.message);

  try {
    await admin.auth.admin.updateUserById(opts.userId, {
      ban_duration: "8760h",
      app_metadata: { deleted: true },
    });
  } catch {
    /* ban is best-effort */
  }

  await admin.from("user_activity").insert({
    user_id: opts.userId,
    username: original,
    action: "account_deleted",
    detail: opts.reason || "Account soft-deleted",
  });

  return { username: reserved, original };
}
