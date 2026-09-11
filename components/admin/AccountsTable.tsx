"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  status: string;
  createdAt: string | null;
};

export default function AccountsTable() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q, sort, status });
      fetch(`/api/admin/accounts?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else {
            setError(null);
            setRows(d.rows || []);
          }
        })
        .catch(() => setError("Could not load accounts"))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, sort, status]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Directory</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">All accounts</h1>
            <p className="mt-1 text-sm text-foreground-muted">Search, filter, then open a profile to act.</p>
          </div>
          <p className="text-xs text-foreground-subtle">{loading ? "Loading" : `${rows.length} shown`}</p>
        </div>
      </div>

      <div className="card grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="input text-sm"
          placeholder="Search username, display name, or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input text-sm sm:w-40" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="username">Username</option>
          <option value="status">Status</option>
        </select>
        <select className="input text-sm sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under review</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs text-foreground-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Signed up</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground-muted">
                  Loading accounts…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground-muted">
                  No accounts match those filters.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70 hover:bg-surface-elevated/60">
                <td className="px-4 py-3">
                  <div className="font-medium">@{row.username}</div>
                  {row.displayName && <div className="text-xs text-foreground-subtle">{row.displayName}</div>}
                </td>
                <td className="px-4 py-3 break-all text-xs text-foreground-muted">{row.email || "—"}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/ops/accounts/${row.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "suspended"
      ? "bg-danger/15 text-danger"
      : status === "under_review" || status === "reviewed"
        ? "bg-amber-500/15 text-amber-500"
        : status === "dismissed"
          ? "bg-foreground-subtle/15 text-foreground-muted"
          : status === "actioned"
            ? "bg-sky-500/15 text-sky-400"
            : "bg-primary/15 text-primary";
  const label = status === "under_review" ? "Under review" : status.replaceAll("_", " ");
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{label}</span>;
}
