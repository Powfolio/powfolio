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

const btn = "rounded-full border border-border px-3 py-1.5 text-xs transition active:scale-95 active:bg-primary/15";
const accent = "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-zinc-950 transition active:scale-95 disabled:opacity-40";

export default function BrandStudio() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [msg, setMsg] = useState("");
  const [logoSrc, setLogoSrc] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState({ x: 40, y: 40, size: 220 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const drag = useRef<{ kind: "pan" | "move" | "resize"; x: number; y: number; crop: { x: number; y: number; size: number }; pan: { x: number; y: number }; corner?: string } | null>(null);

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
    const size = Math.min(220, (box?.width || 280) * 0.62);
    setCrop({ x: ((box?.width || 280) - size) / 2, y: ((box?.height || 320) - size) / 2, size });
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
      setZoom(Math.min(4, Math.max(0.6, pinch.current.zoom * (dist / pinch.current.dist))));
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
      setCrop({ ...d.crop, x: Math.max(8, Math.min(maxW - d.crop.size - 8, d.crop.x + dx)), y: Math.max(8, Math.min(maxH - d.crop.size - 8, d.crop.y + dy)) });
    }
    if (d.kind === "resize") {
      const delta = d.corner === "se" ? Math.max(dx, dy) : d.corner === "nw" ? Math.max(-dx, -dy) : d.corner === "ne" ? Math.max(dx, -dy) : Math.max(-dx, dy);
      const size = Math.max(90, Math.min(Math.min(maxW, maxH) - 16, d.crop.size + delta));
      const ratio = d.crop.size / size;
      setCrop({ x: d.crop.x, y: d.crop.y, size });
      if (ratio > 1) setZoom((z) => Math.min(4, z * (1 + (ratio - 1) * 0.35)));
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
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stageBox = stage.getBoundingClientRect();
    const imgBox = img.getBoundingClientRect();
    const sx = ((crop.x + stageBox.left - imgBox.left) / imgBox.width) * img.naturalWidth;
    const sy = ((crop.y + stageBox.top - imgBox.top) / imgBox.height) * img.naturalHeight;
    const sw = (crop.size / imgBox.width) * img.naturalWidth;
    const sh = (crop.size / imgBox.height) * img.naturalHeight;
    ctx.clearRect(0, 0, 512, 512);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
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
      setWmScale(Math.min(3, Math.max(0.4, wmPinch.current.scale * (dist / wmPinch.current.dist))));
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
    const place = new FormData();
    place.set("kind", "watermark-place");
    place.set("x", String(wmX));
    place.set("y", String(wmY));
    place.set("rotate", String(wmRotate));
    place.set("opacity", String(wmOpacity));
    await fetch("/api/admin/branding", { method: "POST", body: place });
    setMsg("Watermark is public.");
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
              <div className="pointer-events-none absolute inset-x-0 bg-black/55" style={{ top: crop.y + crop.size, bottom: 0 }} />
              <div className="pointer-events-none absolute bg-black/55" style={{ top: crop.y, height: crop.size, left: 0, width: crop.x }} />
              <div className="pointer-events-none absolute bg-black/55" style={{ top: crop.y, height: crop.size, left: crop.x + crop.size, right: 0 }} />
              <div data-crop="1" className="absolute border border-white/90" style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}>
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => <span key={i} className="border border-white/30" />)}
                </div>
                {["nw", "ne", "sw", "se"].map((h) => (
                  <span key={h} data-handle={h} className={`absolute h-4 w-4 border-white ${h.includes("n") ? "-top-1 border-t-2" : "-bottom-1 border-b-2"} ${h.includes("w") ? "-left-1 border-l-2" : "-right-1 border-r-2"}`} />
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className={btn} onClick={() => { setLogoSrc(""); setLogoPreview(""); }}>Cancel</button>
              <button type="button" className={accent} onClick={cropLogo}>Done</button>
            </div>
          </div>
        )}
        {(logoPreview || brand?.logo_url) && (
          <div className="mt-4">
            <p className="text-xs text-foreground-muted">Public preview</p>
            <div className="mt-2 flex items-center gap-4">
              <img src={logoPreview || brand?.logo_url || ""} alt="" className="h-24 w-24 rounded-xl object-contain" />
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <img src={logoPreview || brand?.logo_url || ""} alt="" className="h-8 w-8 object-contain" />
                <span className="text-sm font-semibold">Powfolio</span>
              </div>
            </div>
            <button type="button" className={`${accent} mt-3`} onClick={() => void publishLogo()} disabled={!logoPreview}>Confirm logo</button>
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
        <label className="mt-3 block text-xs text-foreground-muted">Size
          <input className="mt-1 w-full" type="range" min="0.4" max="3" step="0.05" value={wmScale} onChange={(e) => setWmScale(Number(e.target.value))} />
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
