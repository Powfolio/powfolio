import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const enable = Boolean(body?.enable);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (enable && reason.length < 8) {
    return NextResponse.json({ error: "A documented reason is required to place a legal hold." }, { status: 400 });
  }
  try {
    const admin = createServiceClient();
    const now = new Date().toISOString();
    await admin
      .from("profiles")
      .update({
        legal_hold: enable,
        legal_hold_reason: enable ? reason : null,
        legal_hold_at: enable ? now : null,
        legal_hold_by: enable ? gate.session.user.id : null,
        deletion_state: enable ? "legal_hold" : "deleted_pending_retention",
      })
      .eq("id", id);

    await admin
      .from("deleted_profile_archive")
      .update({
        legal_hold: enable,
        legal_hold_reason: enable ? reason : null,
        legal_hold_at: enable ? now : null,
        legal_hold_by: enable ? gate.session.user.id : null,
        deletion_status: enable ? "legal_hold" : "deleted_pending_retention",
        updated_at: now,
      })
      .eq("user_id", id);

    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: enable ? "place_legal_hold" : "remove_legal_hold",
      targetUserId: id,
      reason: reason || null,
    });
    return NextResponse.json({ ok: true, legalHold: enable });
  } catch (e) {
    console.error("legal hold", e);
    return NextResponse.json({ error: "Could not update legal hold" }, { status: 500 });
  }
}
