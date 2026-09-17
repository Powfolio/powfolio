"use client";

import { useEffect, useMemo, useState } from "react";

function formatKindLine(kinds: Record<string, number> | undefined) {
  if (!kinds) return [];
  const rank = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("swap")) return 1;
    if (l.includes("contract deploy")) return 2;
    if (l.includes("transfer") && !l.includes("nft")) return 3;
    if (l.includes("interaction")) return 4;
    return 5;
  };
  const pluralize = (label: string, n: number) => {
    if (n === 1) return label.toLowerCase();
    if (/interaction$/i.test(label)) return `${label.toLowerCase()}s`;
    if (/deployment$/i.test(label)) return "contract deployments";
    if (/swap$/i.test(label)) return "swaps";
    if (/transfer$/i.test(label)) return /nft/i.test(label) ? "NFT transfers" : "transfers";
    if (/s$/i.test(label)) return label.toLowerCase();
    return `${label.toLowerCase()}s`;
  };
  return Object.entries(kinds)
    .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1])
    .map(([label, n]) => `${n} ${pluralize(label, n)}`);
}

function monthsBack(count: number) {
  const now = new Date();
  const out: { key: string; label: string; short: string; year: number; month: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString(undefined, { month: "long", year: "numeric" }),
      short: d.toLocaleString(undefined, { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return out;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function tone(n: number, empty: boolean) {
  if (empty) return "bg-transparent border-transparent text-transparent";
  if (n === 0) return "bg-zinc-800/80 border-white/5 text-zinc-500";
  if (n === 1) return "bg-emerald-500/25 border-emerald-400/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  if (n < 4) return "bg-emerald-400/55 border-emerald-300/40 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.28)]";
  return "bg-emerald-400 border-emerald-200/50 text-zinc-950 shadow-[0_0_14px_rgba(16,185,129,0.45)]";
}

export default function ActivityHeatmap({
  days,
  methods = {},
  counts: countMap,
  kinds = {},
  chainName,
  loading = false,
}: {
  days: string[];
  methods?: Record<string, string[]>;
  counts?: Record<string, number>;
  kinds?: Record<string, Record<string, number>>;
  chainName?: string;
  loading?: boolean;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const [key, kindMap] of Object.entries(kinds || {})) {
      const day = key.slice(0, 10);
      const total = Object.values(kindMap).reduce((sum, n) => sum + n, 0);
      if (total > 0) map.set(day, Math.max(map.get(day) || 0, total));
    }
    for (const [key, n] of Object.entries(countMap || {})) {
      const day = key.slice(0, 10);
      map.set(day, Math.max(map.get(day) || 0, n));
    }
    return map;
  }, [countMap, kinds]);
  const slides = useMemo(() => monthsBack(36), []);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const slide = slides[idx];
  const totalDays = daysInMonth(slide.year, slide.month);
  const startWeekday = new Date(slide.year, slide.month, 1).getDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${slide.key}-${day}`;
    }),
  ];

  useEffect(() => {
    setOpen(null);
  }, [days, countMap, kinds, chainName]);

  const monthActive = useMemo(() => {
    let n = 0;
    let hits = 0;
    for (const [key, count] of counts) {
      if (key.startsWith(slide.key) && count > 0) {
        n += 1;
        hits += count;
      }
    }
    return { days: n, hits };
  }, [counts, slide.key]);

  const selected = open
    ? {
        date: open,
        count: counts.get(open) || 0,
        methods: methods[open] || Object.keys(kinds[open] || {}),
        kinds: kinds[open] || {},
      }
    : null;
  const breakdown = selected ? formatKindLine(selected.kinds) : [];

  return (
    <div className="card space-y-4 overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-heading mb-0">Activity heatmap</p>
          <p className="mt-1 text-sm font-medium text-foreground">{slide.label}</p>
          <p className="mt-0.5 text-[11px] text-foreground-subtle">
            {loading
              ? "Reading daily interactions..."
              : `${monthActive.days} active day${monthActive.days === 1 ? "" : "s"}${
                  monthActive.hits ? ` · ${monthActive.hits} txn${monthActive.hits === 1 ? "" : "s"}` : ""
                }`}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-0.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
            disabled={idx >= slides.length - 1}
            onClick={() => {
              setOpen(null);
              setIdx((v) => Math.min(slides.length - 1, v + 1));
            }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
            disabled={idx <= 0}
            onClick={() => {
              setOpen(null);
              setIdx((v) => Math.max(0, v - 1));
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl border border-border/70 bg-zinc-950/40 px-2 py-3 sm:px-3">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/50">
            <span className="stat-spin" aria-label="Loading heatmap" />
          </div>
        )}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
              {d}
            </div>
          ))}
          {cells.map((key, i) => {
            const n = key ? counts.get(key) || 0 : 0;
            const on = !!key && n > 0;
            const isOpen = Boolean(key) && key === open;
            const dayNum = key ? Number(key.slice(-2)) : 0;
            if (!key) {
              return <div key={`empty-${i}`} className="mx-auto h-7 w-7 sm:h-8 sm:w-8" aria-hidden />;
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => setOpen(open === key ? null : key)}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold leading-none outline-none sm:h-8 sm:w-8 sm:text-[11px] ${tone(n, false)} ${
                  on ? "cursor-pointer hover:scale-110" : "cursor-default"
                } ${isOpen ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-zinc-950" : ""}`}
                aria-label={`Day ${dayNum}, ${n} txn${n === 1 ? "" : "s"}`}
                aria-pressed={isOpen}
                title={`${dayNum} · ${n}`}
              >
                {String(dayNum)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-foreground-subtle">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-full border bg-zinc-800/80 border-white/5" />
          <span className="h-2.5 w-2.5 rounded-full border bg-emerald-500/25 border-emerald-400/30" />
          <span className="h-2.5 w-2.5 rounded-full border bg-emerald-400/55 border-emerald-300/40" />
          <span className="h-2.5 w-2.5 rounded-full border bg-emerald-400 border-emerald-200/50" />
          <span>More</span>
        </div>
        <p>Tap a day for the breakdown</p>
      </div>

      {selected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3">
          <p className="text-sm font-semibold">
            {(() => {
              const d = new Date(`${selected.date}T12:00:00`);
              const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
              const month = d.toLocaleDateString(undefined, { month: "short" });
              return `${weekday}, ${d.getDate()} ${month} ${d.getFullYear()}`;
            })()}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {selected.count === 0 ? "No onchain activity this day." : `${selected.count} txn${selected.count === 1 ? "" : "s"}`}
          </p>
          {breakdown.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-xs leading-relaxed text-foreground-muted">
              {breakdown.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : selected.methods.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.methods.slice(0, 8).map((m) => (
                <span key={m} className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-foreground-muted">
                  {m}
                </span>
              ))}
            </div>
          ) : selected.count > 0 ? (
            <p className="mt-1 text-xs text-foreground-muted">on {chainName || "this chain"}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
