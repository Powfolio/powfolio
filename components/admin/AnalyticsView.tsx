"use client";

import { useCallback, useEffect, useState } from "react";

type Data = {
  total: number;
  active: number;
  last7: number;
  last30: number;
  byDay: { date: string; count: number }[];
  topCountries: { name: string; count: number; share: number }[];
  snapshot: string;
};

export default function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-foreground-muted">Loading analytics…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage metrics</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Snapshot · {new Date(data.snapshot).toLocaleString()} UTC
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary text-xs">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Registered accounts", data.total],
          ["Active", data.active],
          ["New · last 7 days", data.last7],
          ["New · last 30 days", data.last30],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border/40 bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="New accounts" subtitle="Bar · last 30 days">
          <BarChart points={data.byDay} />
        </ChartCard>
        <ChartCard title="Cumulative accounts" subtitle="Area · running total">
          <AreaChart points={data.byDay} />
        </ChartCard>
      </div>

      <ChartCard title="Daily active trend" subtitle="Line · new accounts smoothed">
        <LineChart points={data.byDay} />
      </ChartCard>

      <div className="rounded-2xl border border-border/40 bg-surface p-4">
        <h2 className="text-sm font-medium">Top locations</h2>
        <div className="mt-3 space-y-2">
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

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-surface p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-[11px] text-foreground-subtle">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BarChart({ points }: { points: { date: string; count: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div className="flex h-36 items-end gap-[2px]">
      {points.map((p) => (
        <div key={p.date} className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary" style={{ height: `${(p.count / max) * 100}%` }} title={`${p.date}: ${p.count}`} />
      ))}
    </div>
  );
}

function AreaChart({ points }: { points: { date: string; count: number }[] }) {
  let acc = 0;
  const series = points.map((p) => { acc += p.count; return acc; });
  const max = Math.max(1, ...series);
  const w = 300, h = 120;
  const step = w / Math.max(1, series.length - 1);
  const path = series.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${h - (v / max) * h}`).join(" ");
  const fill = `${path} L${(series.length - 1) * step},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full">
      <path d={fill} fill="currentColor" className="text-primary/20" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
    </svg>
  );
}

function LineChart({ points }: { points: { date: string; count: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const w = 600, h = 140;
  const step = w / Math.max(1, points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${h - (p.count / max) * (h - 8) - 4}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary" />
    </svg>
  );
}
