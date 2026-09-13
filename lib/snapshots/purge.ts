import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/avatars/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

export async function purgeDeletedAccount(opts: {
  userId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
  force?: boolean;
}) {
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, original_username, account_status, legal_hold, purge_at, deletion_state")
    .eq("id", opts.userId)
    .maybeSingle();
  if (!profile) throw new Error("Account not found");
  if (profile.legal_hold && !opts.force) throw new Error("Legal hold is active");
  if (profile.account_status !== "deleted" && profile.deletion_state !== "deleted_pending_retention" && profile.deletion_state !== "purge_pending") {
    throw new Error("Account is not in the deleted retention archive");
  }
  if (!opts.force && profile.purge_at && new Date(profile.purge_at).getTime() > Date.now()) {
    throw new Error("Retention window has not expired");
  }

  const { data: snaps } = await admin
    .from("profile_snapshots")
    .select("media_refs")
    .eq("user_id", opts.userId);
  const paths = new Set<string>();
  for (const snap of snaps || []) {
    for (const url of (snap.media_refs as string[]) || []) {
      const path = storagePathFromPublicUrl(url);
      if (path) paths.add(path);
    }
  }
  if (paths.size) {
    try {
      await admin.storage.from("avatars").remove([...paths]);
    } catch (err) {
      console.error("purge media", err);
    }
  }

  await admin.from("profile_history").delete().eq("user_id", opts.userId);
  await admin.from("profile_snapshots").delete().eq("user_id", opts.userId);
  await admin.from("profile_snapshot_pending").delete().eq("user_id", opts.userId);
  await admin.from("deleted_profile_archive").delete().eq("user_id", opts.userId);
  await admin.from("writings").delete().eq("user_id", opts.userId);
  await admin.from("trade_updates").delete().eq("user_id", opts.userId);
  await admin.from("trades").delete().eq("user_id", opts.userId);
  await admin.from("community_items").delete().eq("user_id", opts.userId);
  await admin.from("airdrops").delete().eq("user_id", opts.userId);
  await admin.from("collectibles").delete().eq("user_id", opts.userId);
  await admin.from("credentials").delete().eq("user_id", opts.userId);

  const stub = `purged_${opts.userId.replace(/-/g, "").slice(0, 10)}`;
  await admin
    .from("profiles")
    .update({
      username: stub,
      original_username: profile.original_username || profile.username,
      display_name: null,
      bio: null,
      long_bio: null,
      avatar_url: null,
      banner_url: null,
      wallet_address: null,
      extra_wallets: [],
      ens_name: null,
      x_url: null,
      discord_url: null,
      telegram_url: null,
      github_url: null,
      website_url: null,
      secondary_email: null,
      primary_email: null,
      skills: [],
      work_experience: [],
      education: [],
      trading_platforms: [],
      is_public: false,
      account_status: "purged",
      deletion_state: "permanently_deleted",
      legal_hold: false,
      legal_hold_reason: null,
    })
    .eq("id", opts.userId);

  try {
    await admin.auth.admin.deleteUser(opts.userId);
  } catch {
    try {
      await admin.auth.admin.updateUserById(opts.userId, {
        ban_duration: "876000h",
        app_metadata: { deleted: true, purged: true },
      });
    } catch {
      /* best-effort */
    }
  }

  await writeAudit({
    actorId: opts.actorId || "00000000-0000-0000-0000-000000000000",
    actorEmail: opts.actorEmail || "system@pow3folio",
    action: "purge_profile",
    targetUserId: opts.userId,
    targetUsername: (profile.original_username || profile.username) as string,
    reason: opts.reason || "Retention expired",
  });

  return { ok: true as const };
}

export async function purgeExpiredArchives() {
  const admin = createServiceClient();
  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("deleted_profile_archive")
    .select("user_id")
    .eq("legal_hold", false)
    .lte("purge_at", now)
    .neq("deletion_status", "permanently_deleted")
    .limit(25);
  const out: Array<{ userId: string; ok: boolean; error?: string }> = [];
  for (const row of rows || []) {
    try {
      await purgeDeletedAccount({ userId: row.user_id, reason: "Automatic 180-day purge" });
      out.push({ userId: row.user_id, ok: true });
    } catch (err) {
      out.push({ userId: row.user_id, ok: false, error: err instanceof Error ? err.message : "failed" });
    }
  }
  return out;
}
