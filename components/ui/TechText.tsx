"use client";

import { useEffect, useRef } from "react";
import "./TechText.css";

type Props = {
  text?: string;
  fontWeight?: number;
  fontSize?: number;
  color?: string;
  accentColor?: string;
  reveal?: "letter" | "area" | "off";
  dashLength?: number;
  dashGap?: number;
  specks?: number;
  clickKick?: boolean;
  className?: string;
};

export default function TechText({
  text = "Your Web3 work.",
  fontWeight = 600,
  fontSize = 120,
  color = "#ffffff",
  accentColor = "#B8863B",
  reveal = "letter",
  dashLength = 4,
  dashGap = 2,
  specks = 12,
  clickKick = true,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return undefined;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let alive = true;
    let presence = 0;
    let pulse = 0;
    const pointer = { x: 0, y: 0, inside: false };
    const lens = { x: 0, y: 0 };

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      wake();
    };

    const approach = (current: number, target: number, dt: number, seconds: number) =>
      current + (target - current) * (1 - Math.exp(-dt / seconds));

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      pulse += dt;

      if (pointer.inside) {
        lens.x = approach(lens.x, pointer.x, dt, 0.05);
        lens.y = approach(lens.y, pointer.y, dt, 0.05);
        presence = approach(presence, 1, dt, 0.12);
      } else {
        presence = approach(presence, 0, dt, 0.2);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const size = Math.min(fontSize, width * 0.18);
      ctx.font = `${fontWeight} ${size}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cx = width / 2;
      const cy = height / 2;

      // Filled text
      ctx.globalAlpha = 1 - presence * 0.7;
      ctx.fillStyle = color;
      ctx.fillText(text, cx, cy);

      // Dashed outline near pointer
      if (presence > 0.05) {
        ctx.globalAlpha = presence * 0.85;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([dashLength, dashGap]);
        ctx.strokeText(text, cx, cy);
        ctx.setLineDash([]);

        // Specks around the text
        if (specks > 0) {
          ctx.globalAlpha = presence * 0.6;
          ctx.fillStyle = accentColor;
          for (let i = 0; i < specks; i++) {
            const a = (i / specks) * Math.PI * 2 + pulse * 0.8;
            const r = size * 0.55 + Math.sin(pulse * 2 + i) * 8;
            const sx = cx + Math.cos(a) * r;
            const sy = cy + Math.sin(a) * r * 0.4;
            const s = 2 + (i % 3);
            ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
          }
        }
      }

      ctx.globalAlpha = 1;

      if ((pointer.inside || presence > 0.01) && visible && alive) {
        raf = requestAnimationFrame(tick);
      }
    };

    const wake = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
    };

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave, { passive: true });

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
    });
    io.observe(container);

    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [text, fontWeight, fontSize, color, accentColor, dashLength, dashGap, specks]);

  return (
    <div ref={containerRef} className={`tech-text ${className}`.trim()} style={{ height: "100%" }}>
      <canvas ref={canvasRef} className="tech-text-canvas" />
    </div>
  );
}
