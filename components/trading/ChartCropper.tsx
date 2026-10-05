"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const RATIO = 16 / 9;

type Props = {
  file: File | null;
  onCancel: () => void;
  onConfirm: (thumb: Blob, full: File) => void;
};

export default function ChartCropper({ file, onCancel, onConfirm }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!file) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(next);
  }, [file]);

  if (!file || !url || typeof document === "undefined") return null;

  function confirm() {
    if (!file) return;
    const img = image.current;
    const box = frame.current;
    if (!img || !box) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = Math.round(1280 / RATIO);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = box.getBoundingClientRect();
    const shown = img.getBoundingClientRect();
    const scale = img.naturalWidth / shown.width;
    const sx = (rect.left - shown.left) * scale;
    const sy = (rect.top - shown.top) * scale;
    const sw = rect.width * scale;
    const sh = rect.height * scale;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob, file); }, "image/jpeg", 0.9);
  }

  return createPortal(
    <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Crop chart thumbnail">
      <div className="crop-sheet">
        <header>
          <div>
            <p>Chart thumbnail</p>
            <h2>Crop the preview</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cancel crop">×</button>
        </header>
        <div
          className="crop-frame"
          ref={frame}
          onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (!drag.current) return; setOffset({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y }); }}
          onPointerUp={() => { drag.current = null; }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={image} src={url} alt="" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
        </div>
        <label>Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
        <div className="crop-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="accent" onClick={confirm}>Use crop</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
