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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All accounts</h1>
        <div className="flex flex-wrap gap-2">
          <input
            className="input text-sm w-56"
            placeholder="Search username or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input text-sm w-36" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="username">Username</option>
            <option value="status">Status</option>
          </select>
          <select className="input text-sm w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under review</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs text-foreground-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">Username</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Signed up</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-foreground-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-foreground-muted">
                  No accounts match.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/70">
                <td className="px-3 py-2">
                  <div className="font-medium">@{row.username}</div>
                  {row.displayName && <div className="text-xs text-foreground-subtle">{row.displayName}</div>}
                </td>
                <td className="px-3 py-2 text-xs break-all">{row.email || "-"}</td>
                <td className="px-3 py-2 text-xs text-foreground-muted">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/ops/accounts/${row.id}`} className="btn-secondary text-xs">
                    View
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
      : status === "under_review"
        ? "bg-amber-500/15 text-amber-400"
        : "bg-primary/15 text-primary";
  const label = status === "under_review" ? "Under review" : status;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{label}</span>;
}
