import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { sendTransactionalEmail, suspensionEmail } from "@/lib/admin/mail";
import { softDeleteAccount } from "@/lib/accounts/soft-delete";

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
    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, original_username, account_status, is_public")
      .eq("id", id)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const publicName = (profile.original_username || profile.username) as string;

    if (action === "delete") {
      const deleted = await softDeleteAccount({ userId: id, reason: reason || "Admin delete" });
      await admin
        .from("profile_reports")
        .update({ status: "actioned", resolved_by: gate.session.user.id, resolved_at: new Date().toISOString() })
        .eq("reported_id", id)
        .in("status", ["pending", "reviewed"]);
      await writeAudit({
        actorId: gate.session.user.id,
        actorEmail: gate.session.email,
        action: "delete_account",
        targetUserId: id,
        targetUsername: deleted.original,
        reason: reason || null,
        meta: { adminUsername: deleted.username },
      });
      return NextResponse.json({ ok: true, status: "deleted" });
    }

    const now = new Date().toISOString();
    if (action === "suspend") {
      await admin
        .from("profiles")
        .update({
          account_status: "suspended",
          suspension_reason: reason || "Suspicious or malicious activity",
          suspended_at: now,
        })
        .eq("id", id);
      await admin
        .from("profile_reports")
        .update({ status: "actioned", resolved_by: gate.session.user.id, resolved_at: now })
        .eq("reported_id", id)
        .in("status", ["pending", "reviewed"]);
      const { data: authUser } = await admin.auth.admin.getUserById(id);
      const to = authUser.user?.email;
      if (to) {
        const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin || "https://pow3folio.vercel.app";
        const mail = suspensionEmail({ username: publicName, origin });
        await sendTransactionalEmail({ to, ...mail });
      }
    } else if (action === "unsuspend") {
      await admin
        .from("profiles")
        .update({
          account_status: "active",
          suspension_reason: null,
          suspended_at: null,
          is_public: true,
        })
        .eq("id", id);
    } else if (action === "review") {
      await admin.from("profiles").update({ account_status: "under_review" }).eq("id", id);
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
      targetUsername: publicName,
      reason: reason || null,
    });

    const nextStatus =
      action === "suspend" ? "suspended" : action === "unsuspend" ? "active" : action === "review" ? "under_review" : profile.account_status || "active";
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (e) {
    console.error("admin action", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Action failed" }, { status: 500 });
  }
}
