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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Audit log</h1>
      <p className="text-sm text-foreground-muted">Append-only. Written automatically when an admin action runs.</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs text-foreground-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Admin</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/70">
                <td className="px-3 py-2 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs break-all">{r.actor_email || "—"}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.target_username ? `@${r.target_username}` : "—"}</td>
                <td className="px-3 py-2 text-xs text-foreground-muted">{r.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
