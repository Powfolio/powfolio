"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  target_username: string | null;
  reason: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  report_reviewed: "Reviewed report",
  report_actioned: "Actioned report",
  report_dismissed: "Dismissed report",
  suspend_account: "Suspended account",
  unsuspend_account: "Unsuspended account",
  delete_account: "Soft-deleted account",
  warn_account: "Logged warning",
  mark_review: "Marked under review",
  view_account: "Opened account",
  promote_admin: "Promoted admin",
};

export default function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRows(d.rows || []);
      })
      .catch(() => setError("Could not load audit log"));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Trust trail</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Append-only. Every admin action writes a row that cannot be edited later.
        </p>
      </div>
      {error && <div className="text-sm text-danger">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-foreground-subtle">
            <tr>
              <th className="py-3 pr-4 font-medium">When</th>
              <th className="py-3 pr-4 font-medium">Admin</th>
              <th className="py-3 pr-4 font-medium">Action</th>
              <th className="py-3 pr-4 font-medium">Target</th>
              <th className="py-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-foreground-muted">
                  No admin actions yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="py-3 pr-4 whitespace-nowrap text-xs text-foreground-muted">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="py-3 pr-4 break-all text-xs">{r.actor_email || "-"}</td>
                <td className="py-3 pr-4 font-medium">{ACTION_LABEL[r.action] || r.action.replaceAll("_", " ")}</td>
                <td className="py-3 pr-4">{r.target_username ? `@${r.target_username}` : "-"}</td>
                <td className="py-3 text-xs text-foreground-muted">{r.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
