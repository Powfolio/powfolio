"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/admin/AccountsTable";

type Appeal = {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  grounds: string;
  statement: string;
  contact_email: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export default function AppealsQueue() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<Appeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load(next = status) {
    const res = await fetch(`/api/admin/appeals?status=${next}`, { credentials: "same-origin" });
    const json = await res.json();
    if (!res.ok) setError(json.error || "Could not load appeals");
    else {
      setError(null);
      setRows(json.rows || []);
    }
  }

  useEffect(() => {
    load(status).catch(() => setError("Could not load appeals"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function decide(id: string, next: string) {
    setBusy(id + next);
    const res = await fetch(`/api/admin/appeals/${id}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note }),
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Update failed");
      return;
    }
    setNote("");
    await load();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Review</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Appeals</h1>
          <p className="mt-1 text-sm text-foreground-muted">Suspended talents submit these from their public page.</p>
        </div>
        <select className="input w-40 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="all">All</option>
        </select>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {rows.length === 0 && <p className="text-sm text-foreground-muted">No appeals in this filter.</p>}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/ops/accounts/${row.user_id}`} className="font-medium hover:text-primary">
                  @{row.username || "unknown"}
                </Link>
                <p className="mt-1 text-xs text-foreground-subtle">
                  {row.email} · {new Date(row.created_at).toLocaleString()} · {row.grounds}
                </p>
              </div>
              <StatusPill status={row.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">{row.statement}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-ghost text-xs" onClick={() => setOpen(open === row.id ? null : row.id)}>
                {open === row.id ? "Hide" : "Decide"}
              </button>
              <Link href={`/${row.username}`} target="_blank" className="btn-ghost text-xs">
                Public page
              </Link>
            </div>
            {open === row.id && (
              <div className="mt-3 space-y-2">
                <textarea className="input min-h-20 text-sm" placeholder="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary text-xs" disabled={!!busy} onClick={() => decide(row.id, "under_review")}>
                    Mark reviewing
                  </button>
                  <button className="btn-primary text-xs" disabled={!!busy} onClick={() => decide(row.id, "approved")}>
                    Approve and unsuspend
                  </button>
                  <button className="btn-ghost text-xs text-danger" disabled={!!busy} onClick={() => decide(row.id, "denied")}>
                    Deny
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
