"use client";

import { useEffect, useState } from "react";

type Data = {
  total: number;
  active: number;
  last7: number;
  last30: number;
  byDay: { date: string; count: number }[];
  topCountries: { name: string; count: number; share: number }[];
};

export default function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch(() => setErr("Failed to load"));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-foreground-muted">Loading analytics…</p>;

  const max = Math.max(1, ...data.byDay.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage metrics</h1>
        <p className="mt-1 text-sm text-foreground-muted">Snapshot · last 30 days</p>
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

      <div className="rounded-2xl border border-border/40 bg-surface p-4">
        <h2 className="text-sm font-medium">New accounts per day</h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {data.byDay.map((d) => (
            <div key={d.date} className="flex-1 rounded-t bg-primary/80" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.date}: ${d.count}`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-foreground-subtle">
          <span>{data.byDay[0]?.date}</span>
          <span>{data.byDay[data.byDay.length - 1]?.date}</span>
        </div>
      </div>

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
