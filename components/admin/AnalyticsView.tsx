"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Point = { date: string; count: number };
type Data = {
  total: number;
  active: number;
  last7: number;
  last30: number;
  dau: number;
  wau: number;
  mau: number;
  byDay: Point[];
  topCountries: { name: string; count: number; share: number }[];
  snapshot: string;
};

export default function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Point | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch("/api/admin/analytics?t=" + Date.now())
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else {
          setData(d);
          setSelected(null);
        }
      })
      .catch(() => setErr("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stickiness = useMemo(() => {
    if (!data || !data.mau) return 0;
    return Math.round((data.dau / data.mau) * 1000) / 10;
  }, [data]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-foreground-muted">Loading analytics…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Snapshot · {new Date(data.snapshot).toLocaleString()} UTC
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary text-xs">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Daily active" value={data.dau} hint="Updated in last 24h" />
        <Kpi label="Weekly active" value={data.wau} hint="Updated in last 7d" />
        <Kpi label="Monthly active" value={data.mau} hint="Updated in last 30d" />
        <Kpi label="DAU / MAU" value={`${stickiness}%`} hint="Stickiness" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total accounts" value={data.total} />
        <Kpi label="Active status" value={data.active} />
        <Kpi label="New · 7 days" value={data.last7} />
        <Kpi label="New · 30 days" value={data.last30} />
      </div>

      <div className="rounded-2xl border border-border/40 bg-surface p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-medium">New accounts</h2>
            <p className="text-[11px] text-foreground-subtle">Last 30 days · click a bar for details</p>
          </div>
          {selected && (
            <p className="text-xs text-foreground-muted">
              {selected.date}: <span className="font-medium text-foreground">{selected.count}</span> new
            </p>
          )}
        </div>
        <BarChart points={data.byDay} onSelect={setSelected} selected={selected?.date} />
      </div>

      <div className="rounded-2xl border border-border/40 bg-surface p-4">
        <h2 className="text-sm font-medium">Top locations</h2>
        <div className="mt-3 space-y-2">
          {data.topCountries.length === 0 && <p className="text-sm text-foreground-muted">No location data yet.</p>}
          {data.topCountries.map((c) => (
            <div key={c.name} className="flex items-center gap-3 text-sm">
              <span className="w-28 truncate text-foreground-muted">{c.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, c.share)}%` }} />
              </div>
              <span className="w-16 text-right tabular-nums">{c.count}</span>
              <span className="w-12 text-right text-foreground-muted">{c.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-surface p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-foreground-muted">{hint}</p>}
    </div>
  );
}

function BarChart({
  points,
  onSelect,
  selected,
}: {
  points: Point[];
  onSelect: (p: Point) => void;
  selected?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div className="flex h-40 items-end gap-[3px] pt-2">
      {points.map((p) => {
        const h = Math.max(2, (p.count / max) * 100);
        const active = selected === p.date;
        return (
          <button
            key={p.date}
            type="button"
            onClick={() => onSelect(p)}
            className={`flex-1 rounded-t transition-all ${active ? "bg-primary" : "bg-primary/70 hover:bg-primary"}`}
            style={{ height: `${h}%` }}
            title={`${p.date}: ${p.count} new accounts`}
            aria-label={`${p.date}: ${p.count} new accounts`}
          />
        );
      })}
    </div>
  );
}
