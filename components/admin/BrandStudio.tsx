"use client";

import { useEffect, useRef, useState } from "react";

type Brand = {
  logo_url: string | null;
  mark_url: string | null;
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

const btn = "rounded-full border border-border px-3 py-1.5 text-xs transition active:scale-95 active:bg-primary/15";
const accent = "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-zinc-950 transition active:scale-95 disabled:opacity-40";

export default function BrandStudio() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [msg, setMsg] = useState("");
  const [logoSrc, setLogoSrc] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState({ x: 24, y: 120, w: 280, h: 88 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const drag = useRef<{ kind: "pan" | "move" | "resize"; x: number; y: number; crop: { x: number; y: number; w: number; h: number }; pan: { x: number; y: number }; corner?: string } | null>(null);

  const [wmText, setWmText] = useState("POWFOLIO.XYZ");
  const [wmMode, setWmMode] = useState<"text" | "image">("text");
  const [wmUrl, setWmUrl] = useState("");
  const [wmX, setWmX] = useState(50);
  const [wmY, setWmY] = useState(50);
  const [wmRotate, setWmRotate] = useState(-24);
  const [wmOpacity, setWmOpacity] = useState(0.2);
  const [wmScale, setWmScale] = useState(1);
  const [wmFile, setWmFile] = useState<File | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const wmPointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const wmPinch = useRef<{ dist: number; scale: number } | null>(null);
  const wmDrag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

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
    setLogoSrc(URL.createObjectURL(file));
    setLogoPreview("");
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const box = stageRef.current?.getBoundingClientRect();
    const w = Math.min(300, (box?.width || 320) * 0.86);
    const h = Math.round(w / 3.2);
    setCrop({ x: ((box?.width || 320) - w) / 2, y: ((box?.height || 280) - h) / 2, w, h });
  }

  function onStageDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
      return;
    }
    const target = (e.target as HTMLElement).dataset.handle;
    if (target) {
      drag.current = { kind: "resize", x: e.clientX, y: e.clientY, crop: { ...crop }, pan: { ...pan }, corner: target };
    } else if ((e.target as HTMLElement).dataset.crop) {
      drag.current = { kind: "move", x: e.clientX, y: e.clientY, crop: { ...crop }, pan: { ...pan } };
    } else {
      drag.current = { kind: "pan", x: e.clientX, y: e.clientY, crop: { ...crop }, pan: { ...pan } };
    }
  }

  function onStageMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      setZoom(Math.min(100, Math.max(0.4, pinch.current.zoom * (dist / pinch.current.dist))));
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const box = stageRef.current?.getBoundingClientRect();
    const maxW = box?.width || 320;
    const maxH = box?.height || 360;
    if (d.kind === "pan") setPan({ x: d.pan.x + dx, y: d.pan.y + dy });
    if (d.kind === "move") {
      setCrop({ ...d.crop, x: Math.max(8, Math.min(maxW - d.crop.w - 8, d.crop.x + dx)), y: Math.max(8, Math.min(maxH - d.crop.h - 8, d.crop.y + dy)) });
    }
    if (d.kind === "resize") {
      const grow = d.corner === "se" || d.corner === "ne" ? dx : -dx;
      const w = Math.max(140, Math.min(maxW - 16, d.crop.w + grow));
      const h = Math.max(44, Math.round(w / 3.2));
      const ratio = d.crop.w / w;
      setCrop({ x: d.crop.x, y: d.crop.y, w, h });
      if (ratio > 1) setZoom((z) => Math.min(100, z * (1 + (ratio - 1) * 0.35)));
    }
  }

  function onStageUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  function cropLogo() {
    const stage = stageRef.current;
    const img = stage?.querySelector("img");
    if (!stage || !img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stageBox = stage.getBoundingClientRect();
    const imgBox = img.getBoundingClientRect();
    const sx = ((crop.x + stageBox.left - imgBox.left) / imgBox.width) * img.naturalWidth;
    const sy = ((crop.y + stageBox.top - imgBox.top) / imgBox.height) * img.naturalHeight;
    const sw = (crop.w / imgBox.width) * img.naturalWidth;
    const sh = (crop.h / imgBox.height) * img.naturalHeight;
    ctx.clearRect(0, 0, 960, 300);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 960, 300);
    setLogoPreview(canvas.toDataURL("image/png"));
    setMsg("Crop ready. Confirm to publish.");
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

  function onSheetDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    wmPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (wmPointers.current.size === 2) {
      const [a, b] = [...wmPointers.current.values()];
      wmPinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: wmScale };
      wmDrag.current = null;
      return;
    }
    wmDrag.current = { x: e.clientX, y: e.clientY, ox: wmX, oy: wmY };
  }

  function onSheetMove(e: React.PointerEvent) {
    if (!wmPointers.current.has(e.pointerId)) return;
    wmPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (wmPointers.current.size === 2 && wmPinch.current) {
      const [a, b] = [...wmPointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      setWmScale(Math.min(100, Math.max(0.2, wmPinch.current.scale * (dist / wmPinch.current.dist))));
      return;
    }
    const d = wmDrag.current;
    const box = sheetRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    setWmX(Math.max(8, Math.min(92, d.ox + ((e.clientX - d.x) / box.width) * 100)));
    setWmY(Math.max(8, Math.min(92, d.oy + ((e.clientY - d.y) / box.height) * 100)));
  }

  function onSheetUp(e: React.PointerEvent) {
    wmPointers.current.delete(e.pointerId);
    if (wmPointers.current.size < 2) wmPinch.current = null;
    if (wmPointers.current.size === 0) wmDrag.current = null;
  }

  async function publishWatermark(file?: File) {
    if (wmMode === "image" && !file && wmUrl && !wmUrl.startsWith("blob:")) {
      const placeOnly = new FormData();
      placeOnly.set("kind", "watermark-place");
      placeOnly.set("x", String(wmX));
      placeOnly.set("y", String(wmY));
      placeOnly.set("rotate", String(wmRotate));
      placeOnly.set("opacity", String(wmOpacity));
      placeOnly.set("scale", String(wmScale));
      placeOnly.set("mode", "image");
      const kept = await fetch("/api/admin/branding", { method: "POST", body: placeOnly });
      const keptData = await kept.json().catch(() => ({}));
      setMsg(kept.ok ? "Watermark is public." : keptData.error || "Could not save watermark.");
      return;
    }
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
    form.set("scale", String(wmScale));
    form.set("mode", wmMode);
    const res = await fetch("/api/admin/branding", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(data.error || "Could not save watermark."); return; }
    if (file && data.url) setWmUrl(data.url);
    setWmMode(wmMode);
    const place = new FormData();
    place.set("kind", "watermark-place");
    place.set("x", String(wmX));
    place.set("y", String(wmY));
    place.set("rotate", String(wmRotate));
    place.set("opacity", String(wmOpacity));
    place.set("scale", String(wmScale));
    place.set("mode", wmMode);
    await fetch("/api/admin/branding", { method: "POST", body: place });
    setMsg("Watermark is public.");
  }

  async function publishMark(file: File) {
    const form = new FormData();
    form.set("kind", "mark");
    form.set("file", file);
    const res = await fetch("/api/admin/branding", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Standalone mark is public." : data.error || "Could not save mark.");
    if (res.ok) setBrand((b) => b ? { ...b, mark_url: data.url } : b);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Site mark</h1>
        <p className="mt-1 text-sm text-foreground-muted">Drag the frame, pinch to zoom, then confirm. Nothing goes public until you confirm.</p>
        {msg && <p className="mt-2 text-sm text-primary">{msg}</p>}
      </div>

      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold">Logo</h2>
        <p className="mt-1 text-xs text-foreground-muted">Drag the image or the frame. Shrink the frame and the image zooms in. Pinch with two fingers.</p>
        <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoFile(f); }} />
        {logoSrc && (
          <div className="mt-4">
            <div
              ref={stageRef}
              className="relative mx-auto h-[360px] w-full max-w-[420px] overflow-hidden rounded-2xl bg-black touch-none"
              onPointerDown={onStageDown}
              onPointerMove={onStageMove}
              onPointerUp={onStageUp}
              onPointerCancel={onStageUp}
            >
              <img src={logoSrc} alt="" className="absolute left-1/2 top-1/2 max-w-none select-none" style={{ width: `${220 * zoom}px`, transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))` }} />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/55" style={{ height: crop.y }} />
              <div className="pointer-events-none absolute inset-x-0 bg-black/55" style={{ top: crop.y + crop.h, bottom: 0 }} />
              <div className="pointer-events-none absolute bg-black/55" style={{ top: crop.y, height: crop.h, left: 0, width: crop.x }} />
              <div className="pointer-events-none absolute bg-black/55" style={{ top: crop.y, height: crop.h, left: crop.x + crop.w, right: 0 }} />
              <div data-crop="1" className="absolute border border-white/90" style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}>
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/30" />)}
                </div>
                {["nw", "ne", "sw", "se"].map((h) => (
                  <span key={h} data-handle={h} className={`absolute h-4 w-4 border-white ${h.includes("n") ? "-top-1 border-t-2" : "-bottom-1 border-b-2"} ${h.includes("w") ? "-left-1 border-l-2" : "-right-1 border-r-2"}`} />
                ))}
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground-muted">Zoom {Math.round(zoom * 100)}%</div>
            <div className="mt-3 flex gap-2">
              <button type="button" className={btn} onClick={() => { setLogoSrc(""); setLogoPreview(""); }}>Cancel</button>
              <button type="button" className={accent} onClick={cropLogo}>Done</button>
            </div>
          </div>
        )}
        {(logoPreview || brand?.logo_url) && (
          <div className="mt-4">
            <p className="text-xs text-foreground-muted">Public preview</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
              <div className="flex h-14 items-center justify-between px-3">
                <img src={logoPreview || brand?.logo_url || ""} alt="" className="h-8 max-w-[150px] object-contain" />
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-zinc-950">Dashboard</span>
              </div>
              <div className="flex h-9 items-center justify-center gap-4 border-t border-border/40 text-[12px] text-foreground-muted">
                <span>Features</span><span>How it works</span><span>FAQ</span>
              </div>
            </div>
            <button type="button" className={`${accent} mt-3`} onClick={() => void publishLogo()} disabled={!logoPreview}>Confirm logo</button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold">Standalone mark</h2>
        <p className="mt-1 text-xs text-foreground-muted">Used when a talent has no profile photo. Square image, circular preview.</p>
        <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void publishMark(f); }} />
        {brand?.mark_url && (
          <div className="mt-3 flex items-center gap-3">
            <img src={brand.mark_url} alt="" className="h-12 w-12 rounded-full object-cover" style={{ boxShadow: "0 0 0 2px #B8863B" }} />
            <span className="text-xs text-foreground-muted">Public fallback preview</span>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold">CV watermark</h2>
        <p className="mt-1 text-xs text-foreground-muted">This is a full A4 sheet. Drag the mark, pinch to resize, then confirm.</p>
        <div className="mt-3 flex gap-2">
          <button type="button" className={`${btn} ${wmMode === "text" ? "bg-primary text-zinc-950" : ""}`} onClick={() => setWmMode("text")}>Text</button>
          <button type="button" className={`${btn} ${wmMode === "image" ? "bg-primary text-zinc-950" : ""}`} onClick={() => setWmMode("image")}>Image</button>
        </div>
        {wmMode === "text" ? (
          <input className="mt-3 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm" value={wmText} onChange={(e) => setWmText(e.target.value)} />
        ) : (
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setWmFile(f); setWmUrl(URL.createObjectURL(f)); setWmMode("image"); } }} />
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={btn} onClick={() => { setWmX(p.x); setWmY(p.y); setWmRotate(p.rotate); }}>{p.label}</button>
          ))}
        </div>
        <label className="mt-3 block text-xs text-foreground-muted">Size {Math.round(wmScale * 100)}%
          <input className="mt-1 w-full" type="range" min="0.2" max="100" step="0.1" value={wmScale} onChange={(e) => setWmScale(Number(e.target.value))} />
        </label>
        <label className="mt-2 block text-xs text-foreground-muted">Rotate {wmRotate}°
          <input className="mt-1 w-full" type="range" min="-90" max="90" value={wmRotate} onChange={(e) => setWmRotate(Number(e.target.value))} />
        </label>
        <label className="mt-2 block text-xs text-foreground-muted">Opacity
          <input className="mt-1 w-full" type="range" min="0.05" max="0.5" step="0.01" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} />
        </label>
        <div
          ref={sheetRef}
          className="relative mx-auto mt-4 w-full max-w-[320px] overflow-hidden rounded-sm border border-border bg-white text-zinc-900 touch-none"
          style={{ aspectRatio: "210 / 297" }}
          onPointerDown={onSheetDown}
          onPointerMove={onSheetMove}
          onPointerUp={onSheetUp}
          onPointerCancel={onSheetUp}
        >
          <div className="absolute left-4 right-4 top-6 h-2 rounded bg-emerald-200" />
          <div className="absolute left-4 top-12 h-3 w-24 rounded bg-zinc-200" />
          <div className="absolute left-4 right-4 top-20 space-y-2">
            <div className="h-2 w-full rounded bg-zinc-100" />
            <div className="h-2 w-5/6 rounded bg-zinc-100" />
            <div className="h-2 w-4/6 rounded bg-zinc-100" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ left: `${wmX}%`, top: `${wmY}%`, transform: `translate(-50%, -50%) rotate(${wmRotate}deg) scale(${wmScale})`, opacity: wmOpacity }}>
            {wmMode === "image" && (wmUrl || brand?.watermark_url) ? (
              <img src={wmUrl || brand?.watermark_url || ""} alt="" className="max-h-24 max-w-[140px] object-contain" />
            ) : (
              <span className="whitespace-nowrap text-2xl font-extrabold tracking-widest text-[#b8863b]">{wmText || "POWFOLIO.XYZ"}</span>
            )}
          </div>
        </div>
        <button type="button" className={`${accent} mt-3`} onClick={() => void publishWatermark(wmMode === "image" ? wmFile || undefined : undefined)}>Confirm watermark</button>
      </section>
    </div>
  );
}
