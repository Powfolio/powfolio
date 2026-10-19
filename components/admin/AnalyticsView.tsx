"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null);

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
            Activity is based on real sign-ins. Snapshot · {new Date(data.snapshot).toLocaleString()} UTC
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
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-medium">New accounts</h2>
              <p className="text-[11px] text-foreground-subtle">Last 30 days · hover for crosshair</p>
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
          <p className="text-[11px] text-foreground-subtle">Click a segment</p>
          <div className="mt-4">
            <Donut items={data.topCountries} />
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
  onHover: (p: { date: string; count: number } | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cross, setCross] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const w = 640, h = 200, padL = 36, padR = 12, padT = 16, padB = 28;
  const max = Math.max(1, ...points.map((p) => p.count));
  const yMax = max <= 5 ? 5 : Math.ceil(max * 1.15);
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padL + i * step;
    const y = padT + innerH - (p.count / yMax) * innerH;
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const fill = coords.length
    ? `${path} L${coords[coords.length - 1].x},${padT + innerH} L${padL},${padT + innerH} Z`
    : "";

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !coords.length) return;
    const mx = ((e.clientX - rect.left) / rect.width) * w;
    let nearest = coords[0];
    let best = Infinity;
    for (const c of coords) {
      const d = Math.abs(c.x - mx);
      if (d < best) { best = d; nearest = c; }
    }
    setCross({ x: nearest.x, y: nearest.y, date: nearest.date, count: nearest.count });
    onHover({ date: nearest.date, count: nearest.count });
  }

  const yTicks = [0, Math.round(yMax / 2), yMax];
  const xTicks = [0, Math.floor(points.length / 2), points.length - 1].filter((i, idx, arr) => arr.indexOf(i) === idx);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className="h-52 w-full cursor-crosshair"
      onMouseMove={onMove}
      onMouseLeave={() => { setCross(null); onHover(null); }}
    >
      {yTicks.map((t) => {
        const y = padT + innerH - (t / yMax) * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity={0.45}>{t}</text>
          </g>
        );
      })}
      {xTicks.map((i) => {
        const c = coords[i];
        if (!c) return null;
        return (
          <text key={i} x={c.x} y={h - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.45}>
            {c.date.slice(5)}
          </text>
        );
      })}
      <path d={fill} fill="currentColor" className="text-primary/12" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary" />
      {cross && (
        <>
          <line x1={cross.x} x2={cross.x} y1={padT} y2={padT + innerH} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 3" />
          <line x1={padL} x2={w - padR} y1={cross.y} y2={cross.y} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 3" />
          <circle cx={cross.x} cy={cross.y} r={5} className="fill-primary" />
          <text x={cross.x + 8} y={cross.y - 8} fontSize="11" fill="currentColor" fontWeight="600">
            {cross.count}
          </text>
        </>
      )}
    </svg>
  );
}

function Donut({ items }: { items: Country[] }) {
  const [sel, setSel] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const colors = ["#B8863B", "#6B8F71", "#7A8FA8", "#A07A6B", "#8A7A6B"];
  const r = 36, c = 50, baseStroke = 10;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  const segs = items.slice(0, 5).map((item, i) => {
    const len = (item.count / total) * circ;
    const start = acc;
    acc += len;
    const mid = start + len / 2;
    const ang = (mid / circ) * Math.PI * 2 - Math.PI / 2;
    return { ...item, i, len, start, ang, color: colors[i % colors.length] };
  });

  const selected = sel !== null ? segs[sel] : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="h-36 w-full">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth={baseStroke} className="text-border/30" />
        {segs.map((s) => {
          const active = sel === s.i;
          const stroke = active ? baseStroke + 4 : baseStroke;
          return (
            <circle
              key={s.name}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.len} ${circ - s.len}`}
              strokeDashoffset={-s.start}
              className="cursor-pointer transition-all"
              onClick={() => setSel(sel === s.i ? null : s.i)}
            />
          );
        })}
        {selected && (
          <>
            <line
              x1={c + Math.cos(selected.ang) * (r + 6)}
              y1={c + Math.sin(selected.ang) * (r + 6)}
              x2={c + Math.cos(selected.ang) * 48}
              y2={c + Math.sin(selected.ang) * 48}
              stroke={selected.color}
              strokeWidth={0.6}
            />
            <text
              x={c + Math.cos(selected.ang) * 48}
              y={c + Math.sin(selected.ang) * 48}
              textAnchor={Math.cos(selected.ang) > 0 ? "start" : "end"}
              fontSize="4.2"
              fill="currentColor"
            >
              {selected.name} · {selected.count} ({selected.share}%)
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
