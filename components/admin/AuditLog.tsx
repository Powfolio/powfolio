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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Append-only. Every admin action writes a row that cannot be edited later.
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs text-foreground-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground-muted">
                  No admin actions yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/70">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-muted">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 break-all text-xs">{r.actor_email || "—"}</td>
                <td className="px-4 py-3 font-medium">{r.action}</td>
                <td className="px-4 py-3">{r.target_username ? `@${r.target_username}` : "—"}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">{r.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
