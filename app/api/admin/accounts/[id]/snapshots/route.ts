import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("profile_snapshots")
      .select("id, version, kind, change_type, change_section, is_final, created_at, actor_kind")
      .eq("user_id", id)
      .order("version", { ascending: false })
      .limit(120);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: "view_profile_snapshots",
      targetUserId: id,
    });
    return NextResponse.json({ rows: data || [] });
  } catch (e) {
    console.error("list snapshots", e);
    return NextResponse.json({ error: "Could not load snapshots" }, { status: 500 });
  }
}
