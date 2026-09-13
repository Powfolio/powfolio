import { createServiceClient } from "@/lib/supabase/admin";
import { assembleProfileState } from "@/lib/snapshots/capture";
import {
  ROLLING_SNAPSHOT_LIMIT,
  SNAPSHOT_BATCH_MS,
  type SnapshotRequest,
} from "@/lib/snapshots/types";

export async function markSnapshotPending(opts: {
  userId: string;
  changeType: string;
  changeSection?: string | null;
}) {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("profile_snapshot_pending")
    .select("change_types, change_sections")
    .eq("user_id", opts.userId)
    .maybeSingle();
  const types = new Set<string>([...((existing?.change_types as string[]) || []), opts.changeType]);
  const sections = new Set<string>([
    ...((existing?.change_sections as string[]) || []),
    opts.changeSection || "profile",
  ]);
  await admin.from("profile_snapshot_pending").upsert({
    user_id: opts.userId,
    change_types: [...types],
    change_sections: [...sections],
    last_change_at: new Date().toISOString(),
  });
}

export async function createProfileSnapshot(req: SnapshotRequest) {
  const admin = createServiceClient();
  const now = Date.now();

  if (!req.force && req.kind === "event") {
    const { data: last } = await admin
      .from("profile_snapshots")
      .select("id, created_at, kind")
      .eq("user_id", req.userId)
      .eq("kind", "event")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last?.created_at && now - new Date(last.created_at).getTime() < SNAPSHOT_BATCH_MS) {
      await markSnapshotPending({
        userId: req.userId,
        changeType: req.changeType,
        changeSection: req.changeSection,
      });
      await admin.from("profile_history").insert({
        user_id: req.userId,
        snapshot_id: last.id,
        change_type: req.changeType,
        change_section: req.changeSection || null,
        previous_value: req.previousValue ?? null,
        new_value: req.newValue ?? null,
        actor_kind: req.actorKind || "user",
        actor_id: req.actorId || null,
      });
      return { skipped: true as const, reason: "batched", snapshotId: last.id as string };
    }
  }

  const payload = await assembleProfileState(req.userId);
  const { data: latest } = await admin
    .from("profile_snapshots")
    .select("version")
    .eq("user_id", req.userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = Number(latest?.version || 0) + 1;
  const isFinal = req.kind === "final_deletion";

  const { data: snapshot, error } = await admin
    .from("profile_snapshots")
    .insert({
      user_id: req.userId,
      version,
      kind: req.kind,
      change_type: req.changeType,
      change_section: req.changeSection || null,
      actor_kind: req.actorKind || "system",
      actor_id: req.actorId || null,
      is_final: isFinal,
      payload,
      media_refs: payload.media,
    })
    .select("id, version, created_at, kind")
    .single();
  if (error || !snapshot) throw new Error(error?.message || "Could not create snapshot");

  await admin.from("profile_history").insert({
    user_id: req.userId,
    snapshot_id: snapshot.id,
    version,
    change_type: req.changeType,
    change_section: req.changeSection || null,
    previous_value: req.previousValue ?? null,
    new_value: req.newValue ?? null,
    actor_kind: req.actorKind || "system",
    actor_id: req.actorId || null,
  });

  const stamp: Record<string, string> = { last_snapshot_at: snapshot.created_at };
  if (req.kind === "monthly") stamp.last_monthly_snapshot_at = snapshot.created_at;
  await admin.from("profiles").update(stamp).eq("id", req.userId);
  await admin.from("profile_snapshot_pending").delete().eq("user_id", req.userId);

  if (!isFinal) {
    const { data: normals } = await admin
      .from("profile_snapshots")
      .select("id")
      .eq("user_id", req.userId)
      .eq("is_final", false)
      .order("version", { ascending: true });
    const extra = (normals || []).slice(0, Math.max(0, (normals || []).length - ROLLING_SNAPSHOT_LIMIT));
    if (extra.length) {
      await admin.from("profile_snapshots").delete().in("id", extra.map((row) => row.id));
    }
  }

  return { skipped: false as const, snapshot };
}

export async function flushPendingSnapshots(beforeMs = SNAPSHOT_BATCH_MS) {
  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - beforeMs).toISOString();
  const { data: pending } = await admin
    .from("profile_snapshot_pending")
    .select("user_id, change_types, change_sections, last_change_at")
    .lte("last_change_at", cutoff)
    .limit(80);
  const results: Array<{ userId: string; ok: boolean }> = [];
  for (const row of pending || []) {
    try {
      const types = (row.change_types as string[]) || ["profile_updated"];
      const sections = (row.change_sections as string[]) || ["profile"];
      await createProfileSnapshot({
        userId: row.user_id,
        kind: "event",
        changeType: types.join(","),
        changeSection: sections.join(","),
        actorKind: "user",
        force: true,
      });
      results.push({ userId: row.user_id, ok: true });
    } catch (err) {
      console.error("flush snapshot", row.user_id, err);
      results.push({ userId: row.user_id, ok: false });
    }
  }
  return results;
}

export async function createMonthlySnapshots() {
  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, last_monthly_snapshot_at, account_status")
    .in("account_status", ["active", "suspended", "under_review"])
    .limit(200);
  let created = 0;
  for (const profile of profiles || []) {
    if (profile.last_monthly_snapshot_at && profile.last_monthly_snapshot_at > cutoff) continue;
    try {
      await createProfileSnapshot({
        userId: profile.id,
        kind: "monthly",
        changeType: "monthly_snapshot",
        changeSection: "profile",
        actorKind: "system",
        force: true,
      });
      created += 1;
    } catch (err) {
      console.error("monthly snapshot", profile.id, err);
    }
  }
  return created;
}
