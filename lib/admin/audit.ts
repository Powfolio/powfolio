import { createServiceClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "view_account"
  | "suspend_account"
  | "unsuspend_account"
  | "delete_account"
  | "warn_account"
  | "mark_review"
  | "report_reviewed"
  | "report_actioned"
  | "report_dismissed"
  | "promote_admin"
  | "other";

export async function writeAudit(entry: {
  actorId: string;
  actorEmail?: string | null;
  action: AuditAction | string;
  targetUserId?: string | null;
  targetUsername?: string | null;
  reportId?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  const admin = createServiceClient();
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: entry.actorId,
    actor_email: entry.actorEmail || null,
    action: entry.action,
    target_user_id: entry.targetUserId || null,
    target_username: entry.targetUsername || null,
    report_id: entry.reportId || null,
    reason: entry.reason || null,
    meta: entry.meta || {},
  });
  if (error) console.error("audit write failed", error.message);
}
