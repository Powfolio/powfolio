"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Trade, TradeUpdate } from "@/types/database";

type Props = {
  trade: Trade;
  updates: TradeUpdate[];
  open: boolean;
  onClose: () => void;
};

export type ChartImage = { thumb: string; full: string };

export function asChart(raw: string | null | undefined): ChartImage | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed.thumb === "string") return { thumb: parsed.thumb, full: parsed.full || parsed.thumb };
    } catch { /* plain url */ }
  }
  return { thumb: value, full: value };
}

export function unpackCharts(raw: string | null | undefined): ChartImage[] {
  if (!raw) return [];
  const value = raw.trim();
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => asChart(typeof item === "string" ? item : JSON.stringify(item))).filter((item): item is ChartImage => Boolean(item)).slice(0, 2);
    } catch { return [asChart(value)].filter((item): item is ChartImage => Boolean(item)); }
  }
  const one = asChart(value);
  return one ? [one] : [];
}

export function packCharts(urls: Array<string | null | undefined>): string | null {
  const clean = urls.filter((item): item is string => Boolean(item)).slice(0, 2);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

export default function TradeUpdatesModal({ trade, updates, open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [full, setFull] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setTheme(localStorage.getItem("pow3folio-theme") === "light" ? "light" : "dark");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const sorted = [...updates].sort((a, b) => {
    const da = a.occurred_at || a.created_at;
    const db = b.occurred_at || b.created_at;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  return createPortal(
    <div className="trade-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Trade updates">
      <button type="button" className="trade-sheet-close" onClick={onClose} aria-label="Close updates">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <div className="trade-sheet" data-theme={theme} onClick={(e) => e.stopPropagation()}>
        <header className="trade-sheet-head">
          <div className="min-w-0">
            <p className="trade-sheet-kicker">Trade record</p>
            <h2>{trade.ticker}{trade.pair ? ` · ${trade.pair}` : ""}</h2>
            <div className="trade-sheet-meta">
              {trade.direction && <span>{trade.direction}</span>}
              <span>{trade.status}</span>
              {trade.roi != null && <span className={trade.roi >= 0 ? "up" : "down"}>{trade.roi > 0 ? "+" : ""}{trade.roi}%</span>}
            </div>
          </div>
        </header>
        <div className="trade-sheet-body">
          <TimelineItem label="Original Call" date={trade.traded_at || trade.created_at?.slice(0, 10)} charts={[trade.chart_url, trade.chart_url_2].map(asChart).filter((item): item is ChartImage => Boolean(item))} caption={trade.analysis} postUrl={trade.post_url} onOpen={setFull} />
          {sorted.map((u, i) => (
            <div key={u.id}>
              <div className="trade-sheet-join">↓ {u.label || `Update ${i + 1}`}</div>
              <TimelineItem label={u.label || `Update ${i + 1}`} date={u.occurred_at || u.created_at?.slice(0, 10)} charts={unpackCharts(u.chart_url)} caption={u.caption} postUrl={u.post_url} onOpen={setFull} />
            </div>
          ))}
        </div>
      </div>
      {full && <button className="trade-full" type="button" onClick={() => setFull(null)} aria-label="Close full chart"><img src={full} alt="" /></button>}
    </div>,
    document.body
  );
}

function TimelineItem({ label, date, charts, caption, postUrl, onOpen }: { label: string; date?: string | null; charts: ChartImage[]; caption?: string | null; postUrl?: string | null; onOpen: (src: string) => void }) {
  return (
    <article className="trade-sheet-item">
      <div className="trade-sheet-item-top"><span>{label}</span>{date && <time>{date}</time>}</div>
      {charts.length > 0 && (
        <div className={`trade-sheet-images${charts.length > 1 ? " two" : ""}`}>
          {charts.slice(0, 2).map((chart) => (
            <button key={chart.thumb} type="button" onClick={() => onOpen(chart.full)} aria-label="Open full chart">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chart.thumb} alt="" />
            </button>
          ))}
        </div>
      )}
      {caption && <p>{caption}</p>}
      {postUrl && <a href={postUrl} target="_blank" rel="noopener noreferrer">View on X</a>}
    </article>
  );
}
