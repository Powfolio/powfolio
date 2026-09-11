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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "under_review", label: "Under review" },
  { id: "suspended", label: "Suspended" },
];

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

  const counts = {
    all: rows.length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Directory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-foreground-muted">Search a builder, open the file, then act.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">Showing</div>
          <div className="text-xl font-semibold tabular-nums">{loading ? "\u2014" : counts.all}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
          <input
            className="input text-sm"
            placeholder="Search username, display name, or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input text-sm lg:w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="username">Username</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                status === item.id ? "bg-primary text-zinc-950" : "bg-surface-elevated text-foreground-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
      )}

      <div className="space-y-2 md:hidden">
        {loading && <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-muted">Loading accounts\u2026</div>}
        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-muted">No accounts match those filters.</div>
        )}
        {rows.map((row) => (
          <Link key={row.id} href={`/ops/accounts/${row.id}`} className="block rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">@{row.username}</div>
                <div className="mt-0.5 text-xs text-foreground-subtle">{row.displayName || row.email || "No display name"}</div>
              </div>
              <StatusPill status={row.status} />
            </div>
            <div className="mt-3 text-[11px] text-foreground-subtle">
              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "\u2014"}
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
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
                  Loading accounts\u2026
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
                <td className="px-4 py-3 text-xs break-all text-foreground-muted">{row.email || "\u2014"}</td>
                <td className="px-4 py-3 text-xs text-foreground-muted">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "\u2014"}
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
        ? "bg-amber-500/15 text-amber-400"
        : status === "dismissed"
          ? "bg-foreground-subtle/15 text-foreground-muted"
          : status === "actioned"
            ? "bg-sky-500/15 text-sky-400"
            : status === "pending"
              ? "bg-orange-500/15 text-orange-400"
              : "bg-primary/15 text-primary";
  const label = status === "under_review" ? "Under review" : status.replaceAll("_", " ");
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{label}</span>;
}
