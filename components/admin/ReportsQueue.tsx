"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/admin/AccountsTable";

type Report = {
  id: string;
  reasons: string[];
  note: string;
  status: string;
  createdAt: string;
  attachments: string[];
  reporterUsername: string;
  reporterEmail: string | null;
};

type Group = {
  id: string;
  reportedId: string;
  reportedUsername: string;
  reportedEmail: string | null;
  count: number;
  latestAt: string;
  status: string;
  reports: Report[];
};

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "reviewed", label: "Reviewed" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

export default function ReportsQueue() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<Group[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(next = status) {
    const res = await fetch(`/api/admin/reports?status=${next}`);
    const json = await res.json();
    if (!res.ok) setError(json.error || "Could not load reports");
    else {
      setError(null);
      setItems(json.items || []);
    }
  }

  useEffect(() => {
    load(status).catch(() => setError("Could not load reports"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function setReportStatus(id: string, next: string) {
    setBusy(id + next);
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Update failed");
      return;
    }
    await load();
  }

  async function openFile(path: string) {
    const res = await fetch(`/api/admin/evidence?path=${encodeURIComponent(path)}`);
    const json = await res.json();
    if (json.url) window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Queue</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-foreground-muted">Grouped by reported account inside a 3-day window.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                status === item.id ? "bg-primary text-zinc-950" : "bg-surface text-foreground-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-sm text-foreground-muted">
          No reports in this filter.
        </div>
      )}
      <div className="space-y-3">
        {items.map((g) => (
          <div key={g.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">@{g.reportedUsername}</div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {g.reportedEmail || "No email"} \u00b7 reported {g.count} {g.count === 1 ? "time" : "times"} \u00b7 last{" "}
                  {new Date(g.latestAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={g.status} />
                <Link href={`/ops/accounts/${g.reportedId}`} className="btn-secondary text-xs">
                  Open account
                </Link>
                <button className="btn-ghost text-xs" onClick={() => setOpen(open === g.id ? null : g.id)}>
                  {open === g.id ? "Hide reports" : "Expand reports"}
                </button>
              </div>
            </div>
            {open === g.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {g.reports.map((r) => (
                  <div key={r.id} className="rounded-xl bg-surface-elevated p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        Reporter @{r.reporterUsername} \u00b7 {r.reporterEmail || "no email"}
                      </span>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-foreground-subtle">{(r.reasons || []).join(", ")}</p>
                    <p className="mt-1 text-foreground-muted">{r.note}</p>
                    {r.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.attachments.map((path) => (
                          <button
                            key={path}
                            type="button"
                            className="btn-ghost text-[11px]"
                            onClick={() => openFile(path)}
                          >
                            Open attachment
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="btn-secondary text-[11px]" disabled={!!busy} onClick={() => setReportStatus(r.id, "reviewed")}>
                        Reviewed
                      </button>
                      <button className="btn-secondary text-[11px]" disabled={!!busy} onClick={() => setReportStatus(r.id, "actioned")}>
                        Actioned
                      </button>
                      <button className="btn-ghost text-[11px]" disabled={!!busy} onClick={() => setReportStatus(r.id, "dismissed")}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
