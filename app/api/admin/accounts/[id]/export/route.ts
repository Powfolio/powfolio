import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  try {
    const admin = createServiceClient();
    const [{ data: profile }, { data: snapshots }, { data: history }, { data: archive }] = await Promise.all([
      admin.from("profiles").select("id, username, original_username, account_status, deletion_state, deleted_at, purge_at, legal_hold, legal_hold_reason").eq("id", id).maybeSingle(),
      admin.from("profile_snapshots").select("id, version, kind, change_type, is_final, created_at, payload").eq("user_id", id).order("version", { ascending: true }),
      admin.from("profile_history").select("id, version, change_type, change_section, created_at, snapshot_id").eq("user_id", id).order("created_at", { ascending: true }),
      admin.from("deleted_profile_archive").select("*").eq("user_id", id).maybeSingle(),
    ]);
    if (!profile) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: "export_profile",
      targetUserId: id,
      targetUsername: profile.original_username || profile.username,
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      profile,
      archive,
      snapshots: snapshots || [],
      history: history || [],
    });
  } catch (e) {
    console.error("export profile", e);
    return NextResponse.json({ error: "Could not export profile" }, { status: 500 });
  }
}
