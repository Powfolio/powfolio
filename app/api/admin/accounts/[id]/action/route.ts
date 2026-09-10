import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

const ACTIONS = new Set(["suspend", "unsuspend", "review", "warn", "delete"]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (id === gate.session.user.id && (action === "delete" || action === "suspend")) {
    return NextResponse.json({ error: "Do not suspend or delete your own admin account from here." }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const { data: profile } = await admin.from("profiles").select("id, username, account_status").eq("id", id).maybeSingle();
    if (!profile) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (action === "delete") {
      await admin.from("profile_reports").update({ status: "actioned", resolved_by: gate.session.user.id, resolved_at: new Date().toISOString() }).eq("reported_id", id).in("status", ["pending", "reviewed"]);
      await writeAudit({
        actorId: gate.session.user.id,
        actorEmail: gate.session.email,
        action: "delete_account",
        targetUserId: id,
        targetUsername: profile.username,
        reason: reason || null,
      });
      await admin.from("profiles").delete().eq("id", id);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, status: "deleted" });
    }

    const nextStatus =
      action === "suspend" ? "suspended" : action === "unsuspend" ? "active" : action === "review" ? "under_review" : profile.account_status || "active";

    if (action === "suspend") {
      await admin.from("profiles").update({ account_status: "suspended", is_public: false }).eq("id", id);
    } else if (action === "unsuspend") {
      await admin.from("profiles").update({ account_status: "active" }).eq("id", id);
    } else if (action === "review") {
      await admin.from("profiles").update({ account_status: "under_review" }).eq("id", id);
    }

    if (action === "suspend") {
      await admin
        .from("profile_reports")
        .update({ status: "actioned", resolved_by: gate.session.user.id, resolved_at: new Date().toISOString() })
        .eq("reported_id", id)
        .in("status", ["pending", "reviewed"]);
    }

    const auditAction =
      action === "suspend"
        ? "suspend_account"
        : action === "unsuspend"
          ? "unsuspend_account"
          : action === "review"
            ? "mark_review"
            : "warn_account";

    await writeAudit({
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      action: auditAction,
      targetUserId: id,
      targetUsername: profile.username,
      reason: reason || null,
    });

    return NextResponse.json({ ok: true, status: action === "warn" ? profile.account_status : nextStatus });
  } catch (e) {
    console.error("admin action", e);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
