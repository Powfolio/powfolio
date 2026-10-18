"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Point = { date: string; count: number };
type Country = { name: string; count: number; share: number };
type Data = {
  total: number;
  active: number;
  last7: number;
  last30: number;
  dau: number;
  wau: number;
  mau: number;
  byDay: Point[];
  topCountries: Country[];
  snapshot: string;
};

export default function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<{ date: string; count: number; x: number } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch("/api/admin/analytics?t=" + Date.now())
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
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
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Activity is based on real sign-ins, not profile edits. Snapshot · {new Date(data.snapshot).toLocaleString()} UTC
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary text-xs">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Daily active" value={data.dau} note="Signed in last 24h" />
        <Kpi label="Weekly active" value={data.wau} note="Signed in last 7d" />
        <Kpi label="Monthly active" value={data.mau} note="Signed in last 30d" />
        <Kpi label="Stickiness" value={`${stickiness}%`} note="DAU / MAU" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-surface p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-medium">New accounts</h2>
              <p className="text-[11px] text-foreground-subtle">Last 30 days</p>
            </div>
            {hover && (
              <div className="text-right text-xs">
                <p className="font-medium">{hover.date}</p>
                <p className="text-foreground-muted">{hover.count} new</p>
              </div>
            )}
          </div>
          <LineChart points={data.byDay} onHover={setHover} />
        </div>

        <div className="rounded-2xl border border-border/50 bg-surface p-5">
          <h2 className="text-sm font-medium">Locations</h2>
          <p className="text-[11px] text-foreground-subtle">Share of accounts</p>
          <div className="mt-4 flex items-center gap-4">
            <Donut items={data.topCountries} />
            <div className="min-w-0 flex-1 space-y-1.5 text-xs">
              {data.topCountries.slice(0, 5).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground-muted">{c.name}</span>
                  <span className="tabular-nums">{c.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total accounts" value={data.total} note="All time" />
        <Kpi label="Active status" value={data.active} note="Not suspended" />
        <Kpi label="New this week" value={data.last7} note="Created last 7d" />
        <Kpi label="New this month" value={data.last30} note="Created last 30d" />
      </div>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-surface px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-1 text-[11px] text-foreground-muted">{note}</p>}
    </div>
  );
}

function LineChart({
  points,
  onHover,
}: {
  points: Point[];
  onHover: (p: { date: string; count: number; x: number } | null) => void;
}) {
  const w = 640, h = 180, pad = 24;
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p.count / max) * (h - pad * 2);
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const fill = `${path} L${coords[coords.length - 1]?.x || pad},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full" onMouseLeave={() => onHover(null)}>
      <path d={fill} fill="currentColor" className="text-primary/15" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary" />
      {coords.map((c) => (
        <circle
          key={c.date}
          cx={c.x}
          cy={c.y}
          r={4}
          className="fill-primary cursor-pointer"
          onMouseEnter={() => onHover({ date: c.date, count: c.count, x: c.x })}
        />
      ))}
    </svg>
  );
}

function Donut({ items }: { items: Country[] }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const colors = ["#B8863B", "#6B8F71", "#7A8FA8", "#A07A6B", "#8A7A6B"];
  let acc = 0;
  const r = 42, c = 50, stroke = 12;
  const circ = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border/40" />
      {items.slice(0, 5).map((item, i) => {
        const len = (item.count / total) * circ;
        const dash = `${len} ${circ - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle
            key={item.name}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth={stroke}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}
