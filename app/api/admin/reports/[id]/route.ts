import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { REPORT_REASONS, REPORT_STATUSES } from "@/lib/reports/constants";

export const runtime = "nodejs";

const REASON_LABEL: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((r) => [r.id, r.label]));

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = String(body?.status || "");
  const adminNote = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!REPORT_STATUSES.includes(status as never)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const { data: report } = await admin
      .from("profile_reports")
      .select("id, reported_id, reasons, note")
      .eq("id", id)
      .maybeSingle();
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const { data: target } = await admin
      .from("profiles")
      .select("username, original_username")
      .eq("id", report.reported_id)
      .maybeSingle();
    const targetUsername = (target?.original_username || target?.username || null) as string | null;

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
    const labels = (Array.isArray(report.reasons) ? report.reasons : [])
      .map((id: string) => REASON_LABEL[id] || id)
      .filter(Boolean);
    const reportReason = [labels.join(", "), report.note].filter(Boolean).join(" — ");

    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action,
      targetUserId: report.reported_id,
      targetUsername,
      reportId: id,
      reason: adminNote || reportReason || null,
      meta: { reportReasons: report.reasons || [], reportNote: report.note || null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin report update", e);
    return NextResponse.json({ error: "Could not update report" }, { status: 500 });
  }
}
