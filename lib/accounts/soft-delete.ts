import { createServiceClient } from "@/lib/supabase/admin";
import { DELETED_USERNAME_RE } from "@/lib/usernames";
import { createProfileSnapshot } from "@/lib/snapshots/record";
import { RETENTION_DAYS } from "@/lib/snapshots/types";

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
  actorId?: string | null;
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
  if (profile.account_status === "purged") {
    throw new Error("Account has already been permanently purged");
  }

  await admin.from("profiles").update({ deletion_state: "deletion_requested" }).eq("id", opts.userId);

  const snapshot = await createProfileSnapshot({
    userId: opts.userId,
    kind: "final_deletion",
    changeType: "final_deletion_snapshot",
    changeSection: "profile",
    actorKind: opts.actorId ? "admin" : "user",
    actorId: opts.actorId || opts.userId,
    force: true,
  });

  await admin.from("profiles").update({ deletion_state: "final_snapshot_created" }).eq("id", opts.userId);

  const original = (profile.original_username || profile.username) as string;
  const reserved = await allocateDeletedUsername(original);
  const now = new Date();
  const purgeAt = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const snapshotId = snapshot.skipped ? snapshot.snapshotId : snapshot.snapshot.id;

  const { error } = await admin
    .from("profiles")
    .update({
      username: reserved,
      original_username: original,
      account_status: "deleted",
      is_public: false,
      deleted_at: now.toISOString(),
      delete_after: purgeAt.toISOString(),
      purge_at: purgeAt.toISOString(),
      deletion_state: "deleted_pending_retention",
    })
    .eq("id", opts.userId);
  if (error) throw new Error(error.message);

  await admin.from("deleted_profile_archive").upsert({
    user_id: opts.userId,
    original_username: original,
    reserved_username: reserved,
    deleted_at: now.toISOString(),
    purge_at: purgeAt.toISOString(),
    deletion_status: "deleted_pending_retention",
    deleted_by: opts.actorId || opts.userId,
    deletion_reason: opts.reason || "Account deleted",
    final_snapshot_id: snapshotId,
    legal_hold: false,
    updated_at: now.toISOString(),
  });

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
    detail: opts.reason || "Account moved to 180-day retention archive",
  });

  return { username: reserved, original, snapshotId, purgeAt: purgeAt.toISOString() };
}

export async function restoreDeletedAccount(opts: {
  userId: string;
  actorId: string;
}) {
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, original_username, account_status")
    .eq("id", opts.userId)
    .maybeSingle();
  if (!profile) throw new Error("Account not found");
  if (profile.account_status !== "deleted") throw new Error("Account is not in the deleted archive");

  const original = ((profile.original_username || profile.username) as string).replace(/_del\d*$/i, "");
  const { data: taken } = await admin.from("profiles").select("id").eq("username", original).maybeSingle();
  const username = taken && taken.id !== opts.userId ? `${original}_r${Date.now().toString().slice(-4)}` : original;

  await admin
    .from("profiles")
    .update({
      username,
      original_username: null,
      account_status: "active",
      is_public: true,
      deleted_at: null,
      delete_after: null,
      purge_at: null,
      deletion_state: "active",
    })
    .eq("id", opts.userId);

  await admin
    .from("deleted_profile_archive")
    .update({ deletion_status: "restored", updated_at: new Date().toISOString() })
    .eq("user_id", opts.userId);

  try {
    await admin.auth.admin.updateUserById(opts.userId, {
      ban_duration: "none",
      app_metadata: { deleted: false },
    });
  } catch {
    /* best-effort */
  }

  await admin.from("user_activity").insert({
    user_id: opts.userId,
    username,
    action: "account_restored",
    detail: "Restored from deleted retention archive",
  });

  return { username };
}
