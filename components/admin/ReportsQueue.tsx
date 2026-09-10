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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Reports</h1>
        <select className="input text-sm w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {items.length === 0 && <p className="text-sm text-foreground-muted">No reports in this filter.</p>}
      <div className="space-y-3">
        {items.map((g) => (
          <div key={g.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">
                  @{g.reportedUsername}{" "}
                  <span className="text-xs font-normal text-foreground-subtle">{g.reportedEmail}</span>
                </div>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Reported {g.count} {g.count === 1 ? "time" : "times"} · last {new Date(g.latestAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={g.status} />
                <Link href={`/ops/accounts/${g.reportedId}`} className="btn-secondary text-xs">
                  Open account
                </Link>
                <button className="btn-ghost text-xs" onClick={() => setOpen(open === g.id ? null : g.id)}>
                  {open === g.id ? "Hide" : "Expand"}
                </button>
              </div>
            </div>
            {open === g.id && (
              <div className="mt-3 space-y-3 border-t border-border pt-3">
                {g.reports.map((r) => (
                  <div key={r.id} className="rounded-lg bg-surface-elevated p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        Reporter @{r.reporterUsername} · {r.reporterEmail || "no email"}
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
                    <div className="mt-2 flex flex-wrap gap-2">
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
