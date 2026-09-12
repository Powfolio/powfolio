import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body?.status || "");
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  if (!["under_review", "approved", "denied"].includes(status)) {
    return NextResponse.json({ error: "Unknown appeal status" }, { status: 400 });
  }
  try {
    const admin = createServiceClient();
    const { data: appeal } = await admin.from("account_appeals").select("*").eq("id", id).maybeSingle();
    if (!appeal) return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    await admin.from("account_appeals").update({
      status,
      admin_note: note || appeal.admin_note,
      reviewed_by: gate.session.user.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (status === "approved" && appeal.user_id) {
      await admin.from("profiles").update({ account_status: "active", suspension_reason: null, suspended_at: null }).eq("id", appeal.user_id);
    }
    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: status === "approved" ? "unsuspend_account" : "other",
      targetUserId: appeal.user_id,
      targetUsername: appeal.username,
      reason: note || `appeal_${status}`,
      meta: { appealId: id, appealStatus: status },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("appeal action", e);
    return NextResponse.json({ error: "Could not update appeal" }, { status: 500 });
  }
}
