"use client";

import { useEffect, useRef, useState } from "react";

type Brand = {
  logo_url: string | null;
  watermark_mode: "text" | "image";
  watermark_text: string;
  watermark_url: string | null;
  watermark_x: number;
  watermark_y: number;
  watermark_rotate: number;
  watermark_opacity: number;
};

const PRESETS = [
  { id: "diag", label: "Center diagonal", x: 50, y: 50, rotate: -24 },
  { id: "h", label: "Center horizontal", x: 50, y: 50, rotate: 0 },
  { id: "v", label: "Center vertical", x: 50, y: 50, rotate: 90 },
];

export default function BrandStudio() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [msg, setMsg] = useState("");
  const [logoSrc, setLogoSrc] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [wmText, setWmText] = useState("POWFOLIO.XYZ");
  const [wmMode, setWmMode] = useState<"text" | "image">("text");
  const [wmUrl, setWmUrl] = useState("");
  const [wmX, setWmX] = useState(50);
  const [wmY, setWmY] = useState(50);
  const [wmRotate, setWmRotate] = useState(-24);
  const [wmOpacity, setWmOpacity] = useState(0.2);

  useEffect(() => {
    fetch("/api/branding").then((r) => r.json()).then((d: Brand) => {
      setBrand(d);
      setWmText(d.watermark_text || "POWFOLIO.XYZ");
      setWmMode(d.watermark_mode || "text");
      setWmUrl(d.watermark_url || "");
      setWmX(d.watermark_x ?? 50);
      setWmY(d.watermark_y ?? 50);
      setWmRotate(d.watermark_rotate ?? -24);
      setWmOpacity(d.watermark_opacity ?? 0.2);
    }).catch(() => setMsg("Could not load branding."));
  }, []);

  function onLogoFile(file: File) {
    const url = URL.createObjectURL(file);
    setLogoSrc(url);
    setLogoPreview("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function cropLogo() {
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.max(size / img.width, size / img.height) * zoom;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, (size - w) / 2 + offset.x, (size - h) / 2 + offset.y, w, h);
      setLogoPreview(canvas.toDataURL("image/png"));
    };
    img.src = logoSrc;
  }

  async function publishLogo() {
    if (!logoPreview) return;
    const blob = await (await fetch(logoPreview)).blob();
    const form = new FormData();
    form.set("kind", "logo");
    form.set("file", new File([blob], "logo.png", { type: "image/png" }));
    const res = await fetch("/api/admin/branding", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Logo is public." : data.error || "Could not save logo.");
    if (res.ok) setBrand((b) => b ? { ...b, logo_url: data.url } : b);
  }

  async function publishWatermark(file?: File) {
    const form = new FormData();
    if (file) {
      form.set("kind", "watermark");
      form.set("file", file);
    } else {
      form.set("kind", "watermark-text");
      form.set("text", wmText);
    }
    form.set("x", String(wmX));
    form.set("y", String(wmY));
    form.set("rotate", String(wmRotate));
    form.set("opacity", String(wmOpacity));
    const res = await fetch("/api/admin/branding", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(data.error || "Could not save watermark."); return; }
    if (file && data.url) { setWmUrl(data.url); setWmMode("image"); }
    else setWmMode("text");
    await fetch("/api/admin/branding", {
      method: "POST",
      body: (() => { const f = new FormData(); f.set("kind", "watermark-place"); f.set("x", String(wmX)); f.set("y", String(wmY)); f.set("rotate", String(wmRotate)); f.set("opacity", String(wmOpacity)); return f; })(),
    });
    setMsg("Watermark is public.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Site mark</h1>
        <p className="mt-1 text-sm text-foreground-muted">Upload a logo or a CV watermark. Nothing goes public until you confirm.</p>
        {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
      </div>

      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold">Logo</h2>
        <p className="mt-1 text-xs text-foreground-muted">The mark used in the nav, dashboard, and CV. No extra background is added.</p>
        <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoFile(f); }} />
        {logoSrc && (
          <div className="mt-4">
            <div
              className="relative mx-auto h-56 w-56 overflow-hidden rounded-xl border border-border bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]"
              onPointerDown={(e) => { drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; }}
              onPointerMove={(e) => { if (!drag.current) return; setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
              onPointerUp={() => { drag.current = null; }}
              onPointerLeave={() => { drag.current = null; }}
            >
              <img src={logoSrc} alt="" className="absolute left-1/2 top-1/2 max-w-none select-none" style={{ width: `${160 * zoom}px`, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` }} />
            </div>
            <label className="mt-3 block text-xs text-foreground-muted">Zoom
              <input className="mt-1 w-full" type="range" min="0.6" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <div className="mt-3 flex gap-2">
              <button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs" onClick={cropLogo}>Crop</button>
              <button type="button" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-zinc-950" onClick={() => void publishLogo()} disabled={!logoPreview}>Confirm logo</button>
            </div>
          </div>
        )}
        {(logoPreview || brand?.logo_url) && (
          <div className="mt-4">
            <p className="text-xs text-foreground-muted">Public preview</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <img src={logoPreview || brand?.logo_url || ""} alt="" className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold">Powfolio</span>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold">CV watermark</h2>
        <div className="mt-3 flex gap-2">
          <button type="button" className={`rounded-full px-3 py-1 text-xs ${wmMode === "text" ? "bg-primary text-zinc-950" : "border border-border"}`} onClick={() => setWmMode("text")}>Text</button>
          <button type="button" className={`rounded-full px-3 py-1 text-xs ${wmMode === "image" ? "bg-primary text-zinc-950" : "border border-border"}`} onClick={() => setWmMode("image")}>Image</button>
        </div>
        {wmMode === "text" ? (
          <input className="mt-3 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm" value={wmText} onChange={(e) => setWmText(e.target.value)} />
        ) : (
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void publishWatermark(f); }} />
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="rounded-full border border-border px-3 py-1 text-xs" onClick={() => { setWmX(p.x); setWmY(p.y); setWmRotate(p.rotate); }}>{p.label}</button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 max-w-[180px]">
          <span />
          <button type="button" className="rounded-lg border border-border py-1 text-xs" onClick={() => setWmY((v) => Math.max(10, v - 4))}>Up</button>
          <span />
          <button type="button" className="rounded-lg border border-border py-1 text-xs" onClick={() => setWmX((v) => Math.max(10, v - 4))}>Left</button>
          <button type="button" className="rounded-lg border border-border py-1 text-xs" onClick={() => { setWmX(50); setWmY(50); }}>Center</button>
          <button type="button" className="rounded-lg border border-border py-1 text-xs" onClick={() => setWmX((v) => Math.min(90, v + 4))}>Right</button>
          <span />
          <button type="button" className="rounded-lg border border-border py-1 text-xs" onClick={() => setWmY((v) => Math.min(90, v + 4))}>Down</button>
          <span />
        </div>
        <label className="mt-3 block text-xs text-foreground-muted">Rotate {wmRotate}°
          <input className="mt-1 w-full" type="range" min="-90" max="90" value={wmRotate} onChange={(e) => setWmRotate(Number(e.target.value))} />
        </label>
        <label className="mt-2 block text-xs text-foreground-muted">Opacity
          <input className="mt-1 w-full" type="range" min="0.05" max="0.5" step="0.01" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} />
        </label>
        <div className="relative mt-4 h-56 overflow-hidden rounded-xl border border-border bg-white text-zinc-900">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: `${wmX}%`, top: `${wmY}%`, transform: `translate(-50%, -50%) rotate(${wmRotate}deg)`, opacity: wmOpacity }}>
            {wmMode === "image" && (wmUrl || brand?.watermark_url) ? (
              <img src={wmUrl || brand?.watermark_url || ""} alt="" className="max-h-24 max-w-[180px] object-contain" />
            ) : (
              <span className="text-3xl font-extrabold tracking-widest text-[#b8863b]">{wmText || "POWFOLIO.XYZ"}</span>
            )}
          </div>
          <div className="p-4 text-xs text-zinc-500">Preview of the CV sheet. Confirm to publish this placement.</div>
        </div>
        <button type="button" className="mt-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-zinc-950" onClick={() => void publishWatermark()}>Confirm watermark</button>
      </section>
    </div>
  );
}
