import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { diffSnapshots } from "@/lib/snapshots/diff";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; sid: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id, sid } = await ctx.params;
  const compare = req.nextUrl.searchParams.get("compare");
  try {
    const admin = createServiceClient();
    const { data: snap, error } = await admin
      .from("profile_snapshots")
      .select("id, user_id, version, kind, change_type, change_section, is_final, created_at, payload, media_refs, actor_kind")
      .eq("id", sid)
      .eq("user_id", id)
      .maybeSingle();
    if (error || !snap) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

    let diff = null;
    if (compare) {
      const { data: other } = await admin
        .from("profile_snapshots")
        .select("id, version, payload, created_at")
        .eq("id", compare)
        .eq("user_id", id)
        .maybeSingle();
      if (other) {
        diff = {
          otherId: other.id,
          otherVersion: other.version,
          changes: diffSnapshots(other.payload as Record<string, unknown>, snap.payload as Record<string, unknown>),
        };
      }
    }

    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: "view_profile_snapshot",
      targetUserId: id,
      meta: { snapshotId: sid, version: snap.version },
    });

    return NextResponse.json({ snapshot: snap, diff });
  } catch (e) {
    console.error("view snapshot", e);
    return NextResponse.json({ error: "Could not load snapshot" }, { status: 500 });
  }
}
