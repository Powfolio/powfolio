"use client";

import { useMemo, useState } from "react";

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
  if (empty) return "bg-transparent border-transparent pointer-events-none";
  if (n === 0) return "bg-zinc-800/80 border-white/5";
  if (n === 1) return "bg-emerald-500/25 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  if (n < 4) return "bg-emerald-400/55 border-emerald-300/40 shadow-[0_0_12px_rgba(16,185,129,0.28)]";
  return "bg-emerald-400 border-emerald-200/50 shadow-[0_0_14px_rgba(16,185,129,0.45)]";
}

export default function ActivityHeatmap({
  days,
  methods = {},
}: {
  days: string[];
  methods?: Record<string, string[]>;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of days) {
      const key = day.slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [days]);
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
  const monthActive = useMemo(() => {
    let n = 0;
    let hits = 0;
    for (const [key, count] of counts) {
      if (key.startsWith(slide.key)) {
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
        methods: methods[open] || [],
      }
    : null;

  return (
    <div className="card space-y-4 overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-heading mb-0">Activity heatmap</p>
          <p className="mt-1 text-sm font-medium text-foreground">{slide.label}</p>
          <p className="mt-0.5 text-[11px] text-foreground-subtle">
            {monthActive.days} active day{monthActive.days === 1 ? "" : "s"}
            {monthActive.hits ? ` · ${monthActive.hits} interaction${monthActive.hits === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-0.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
            disabled={idx >= slides.length - 1}
            onClick={() => setIdx((v) => Math.min(slides.length - 1, v + 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30"
            disabled={idx <= 0}
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-zinc-950/40 px-2.5 py-3 sm:px-3">
        <div className="grid grid-cols-7 gap-y-2 gap-x-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
              {d}
            </div>
          ))}
          {cells.map((key, i) => {
            const n = key ? counts.get(key) || 0 : 0;
            const on = !!key && n > 0;
            const isOpen = key === open;
            return (
              <button
                key={key || `empty-${i}`}
                type="button"
                disabled={!key}
                onClick={() => key && setOpen(open === key ? null : key)}
                className={`heat-dot mx-auto ${tone(n, !key)} ${on ? "cursor-pointer hover:scale-110" : "cursor-default"} ${
                  isOpen ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-zinc-950" : ""
                }`}
                aria-label={key ? `${key}, ${n} interaction${n === 1 ? "" : "s"}` : undefined}
                title={key ? `${key} · ${n}` : undefined}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-foreground-subtle">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="heat-dot-legend bg-zinc-800/80 border-white/5" />
          <span className="heat-dot-legend bg-emerald-500/25 border-emerald-400/30" />
          <span className="heat-dot-legend bg-emerald-400/55 border-emerald-300/40" />
          <span className="heat-dot-legend bg-emerald-400 border-emerald-200/50" />
          <span>More</span>
        </div>
        <p>Tap a day for detail</p>
      </div>

      {selected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3">
          <p className="text-sm font-semibold">
            {new Date(`${selected.date}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {selected.count === 0
              ? "No onchain activity this day."
              : `${selected.count} interaction${selected.count === 1 ? "" : "s"} on this chain.`}
          </p>
          {selected.methods.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.methods.slice(0, 6).map((m) => (
                <span key={m} className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-foreground-muted">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
