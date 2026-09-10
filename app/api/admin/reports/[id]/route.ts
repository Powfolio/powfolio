import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { REPORT_STATUSES } from "@/lib/reports/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = String(body?.status || "");
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!REPORT_STATUSES.includes(status as never)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const { data: report } = await admin.from("profile_reports").select("id, reported_id").eq("id", id).maybeSingle();
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const { error } = await admin
      .from("profile_reports")
      .update({
        status,
        resolved_by: gate.session.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const action =
      status === "dismissed" ? "report_dismissed" : status === "actioned" ? "report_actioned" : "report_reviewed";
    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action,
      targetUserId: report.reported_id,
      reportId: id,
      reason: reason || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin report update", e);
    return NextResponse.json({ error: "Could not update report" }, { status: 500 });
  }
}
