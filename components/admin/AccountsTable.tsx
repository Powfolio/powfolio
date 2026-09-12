"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  username: string;
  originalUsername: string | null;
  displayName: string | null;
  email: string | null;
  status: string;
  createdAt: string | null;
  avatarUrl: string | null;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "under_review", label: "Under review" },
  { id: "suspended", label: "Suspended" },
];

const MONTHS = [
  ["all", "Any month"],
  ["1", "Jan"],
  ["2", "Feb"],
  ["3", "Mar"],
  ["4", "Apr"],
  ["5", "May"],
  ["6", "Jun"],
  ["7", "Jul"],
  ["8", "Aug"],
  ["9", "Sep"],
  ["10", "Oct"],
  ["11", "Nov"],
  ["12", "Dec"],
];

export default function AccountsTable({ scope = "live" }: { scope?: "live" | "deleted" }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q, sort, status, year, month, scope });
      fetch(`/api/admin/accounts?${params}`, { credentials: "same-origin" })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) setError(d.error || "Could not load accounts");
          else setError(null);
          if (Array.isArray(d.rows)) setRows(d.rows);
        })
        .catch(() => setError("Could not load accounts"))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, sort, status, year, month, scope]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ((cur) => cur.trim());
  }

  const years = Array.from(
    new Set(rows.map((r) => (r.createdAt ? String(new Date(r.createdAt).getFullYear()) : "")).filter(Boolean))
  ).sort().reverse();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {scope === "deleted" ? "Retention" : "Directory"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {scope === "deleted" ? "Deleted accounts" : "Accounts"}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {scope === "deleted"
              ? "Soft-deleted for 180 days. Public username is free again."
              : "Search a builder, open the file, then act."}
          </p>
        </div>
        <p className="text-sm text-foreground-subtle">{loading ? "Loading accounts..." : `${rows.length} shown`}</p>
      </div>

      <form onSubmit={onSearch} className="space-y-3">
        <input
          className="input text-sm"
          placeholder="Search username, display name, or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="username">Username</option>
            <option value="status">Status</option>
          </select>
          <select className="input w-auto text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
            {!years.includes("2026") && <option value="2026">2026</option>}
            {!years.includes("2025") && <option value="2025">2025</option>}
          </select>
          <select className="input w-auto text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        {scope === "live" && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  status === item.id ? "bg-primary text-zinc-950" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && <div className="text-sm text-danger">{error}</div>}

      <div className="space-y-1">
        {loading && <div className="py-8 text-sm text-foreground-muted">Loading accounts...</div>}
        {!loading && rows.length === 0 && <div className="py-8 text-sm text-foreground-muted">No accounts match those filters.</div>}
        {rows.map((row) => {
          const publicName = row.originalUsername || row.username.replace(/_del\d*$/i, "");
          const label = scope === "deleted" ? `${publicName}_del` : row.username;
          return (
            <Link key={row.id} href={`/ops/accounts/${row.id}`} className="flex items-center gap-3 px-1 py-3 hover:bg-white/5">
              <Avatar url={row.avatarUrl} name={row.displayName || publicName} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">@{label}</div>
                <div className="truncate text-xs text-foreground-subtle">{row.displayName || row.email || "No display name"}</div>
              </div>
              <StatusPill status={row.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="h-11 w-11 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "suspended" || status === "denied"
      ? "bg-danger/15 text-danger"
      : status === "under_review" || status === "reviewed"
        ? "bg-amber-500/15 text-amber-400"
        : status === "dismissed" || status === "deleted"
          ? "bg-foreground-subtle/15 text-foreground-muted"
          : status === "actioned"
            ? "bg-sky-500/15 text-sky-400"
            : status === "pending"
              ? "bg-orange-500/15 text-orange-400"
              : "bg-primary/15 text-primary";
  const label = status === "under_review" ? "Under review" : status.replaceAll("_", " ");
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{label}</span>;
}
