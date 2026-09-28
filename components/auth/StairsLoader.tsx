"use client";

import { useEffect, useRef } from "react";

const COLOR = "#B8863B";

export default function StairsLoader({
  open,
  title,
  subtitle,
}: {
  open: boolean;
  title: string;
  subtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !open) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 240;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const NUM_BARS = 5;
    const BAR_WIDTH = 18;
    const BAR_SPACING = 27;
    const BASE_Y = 148;
    const MAX_BAR_H = 100;
    const MIN_BAR_H = 24;
    const BALL_RADIUS = 9;
    const BOTTOM_CORNER_RADIUS = 4;
    const totalSpan = (NUM_BARS - 1) * BAR_SPACING + BAR_WIDTH;
    const startX = (W - totalSpan) / 2 + BAR_WIDTH / 2;
    const barX = [0, 1, 2, 3, 4].map((i) => startX + i * BAR_SPACING);
    const getStdHeight = (i: number) => MAX_BAR_H - i * ((MAX_BAR_H - MIN_BAR_H) / (NUM_BARS - 1));
    const getInvHeight = (i: number) => MIN_BAR_H + i * ((MAX_BAR_H - MIN_BAR_H) / (NUM_BARS - 1));
    const easeCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const DURATIONS = [0.32, 0.32, 0.32, 0.32, 0.46, 0.32, 0.32, 0.32, 0.32, 0.46];
    const TOTAL_TIME = DURATIONS.reduce((a, b) => a + b, 0);

    let masterTime = 0;
    let lastTime = performance.now();
    let heights = [0, 1, 2, 3, 4].map((i) => getStdHeight(i));
    let squish = [0, 0, 0, 0, 0];
    let running = true;
    let frame = 0;

    function render(now: number) {
      if (!running || !ctx) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      masterTime = (masterTime + dt) % TOTAL_TIME;

      let accum = 0;
      let step = 0;
      let pT = 0;
      for (let i = 0; i < DURATIONS.length; i++) {
        if (masterTime < accum + DURATIONS[i]) {
          step = i;
          pT = (masterTime - accum) / DURATIONS[i];
          break;
        }
        accum += DURATIONS[i];
      }

      let fromIdx = 0;
      let toIdx = 1;
      let isLaunch = false;
      if (step === 0) {
        fromIdx = 0;
        toIdx = 1;
      } else if (step === 1) {
        fromIdx = 1;
        toIdx = 2;
      } else if (step === 2) {
        fromIdx = 2;
        toIdx = 3;
      } else if (step === 3) {
        fromIdx = 3;
        toIdx = 4;
      } else if (step === 4) {
        fromIdx = 4;
        toIdx = 4;
        isLaunch = true;
      } else if (step === 5) {
        fromIdx = 4;
        toIdx = 3;
      } else if (step === 6) {
        fromIdx = 3;
        toIdx = 2;
      } else if (step === 7) {
        fromIdx = 2;
        toIdx = 1;
      } else if (step === 8) {
        fromIdx = 1;
        toIdx = 0;
      } else {
        fromIdx = 0;
        toIdx = 0;
        isLaunch = true;
      }

      for (let i = 0; i < NUM_BARS; i++) {
        let targetH = 0;
        if (step <= 3) targetH = getStdHeight(i);
        else if (step === 4) targetH = getStdHeight(i) * (1 - easeCubic(pT)) + getInvHeight(i) * easeCubic(pT);
        else if (step >= 5 && step <= 8) targetH = getInvHeight(i);
        else targetH = getInvHeight(i) * (1 - easeCubic(pT)) + getStdHeight(i) * easeCubic(pT);
        heights[i] += (targetH - heights[i]) * Math.min(1, 16 * dt);
        squish[i] += (0 - squish[i]) * Math.min(1, 18 * dt);
      }

      if (!isLaunch && pT < 0.15) squish[fromIdx] = -Math.sin((pT / 0.15) * Math.PI) * 5;
      if (isLaunch) squish[fromIdx] = Math.sin(Math.min(pT / 0.5, 1) * Math.PI) * 14;

      let bx = 0;
      let by = 0;
      let scaleX = 1;
      let scaleY = 1;
      if (!isLaunch) {
        bx = barX[fromIdx] + (barX[toIdx] - barX[fromIdx]) * pT;
        const sy = BASE_Y - heights[fromIdx] - BALL_RADIUS;
        const ty = BASE_Y - heights[toIdx] - BALL_RADIUS;
        by = sy * (1 - pT) + ty * pT - 4 * 24 * pT * (1 - pT);
        if (pT < 0.12) {
          const sq = Math.sin((pT / 0.12) * Math.PI) * 0.22;
          scaleX = 1 + sq;
          scaleY = 1 - sq;
        } else if (pT > 0.35 && pT < 0.65) {
          scaleX = 0.94;
          scaleY = 1.08;
        }
      } else {
        bx = barX[fromIdx];
        by = BASE_Y - heights[fromIdx] - BALL_RADIUS - 4 * 50 * pT * (1 - pT);
        if (pT < 0.2) {
          scaleX = 1.2;
          scaleY = 0.82;
        } else if (pT < 0.6) {
          scaleX = 0.85;
          scaleY = 1.22;
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.fillStyle = COLOR;
      for (let i = 0; i < NUM_BARS; i++) {
        const h = Math.max(12, heights[i] + squish[i]);
        const top = BASE_Y - h;
        const topR = BAR_WIDTH / 2;
        const bR = Math.min(BOTTOM_CORNER_RADIUS, h / 2, topR);
        const left = barX[i] - topR;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(left, top, BAR_WIDTH, h, [topR, topR, bR, bR]);
        } else {
          ctx.moveTo(left, BASE_Y - bR);
          ctx.lineTo(left, top + topR);
          ctx.arc(barX[i], top + topR, topR, Math.PI, 0, false);
          ctx.lineTo(left + BAR_WIDTH, BASE_Y - bR);
          ctx.arc(left + BAR_WIDTH - bR, BASE_Y - bR, bR, 0, Math.PI / 2, false);
          ctx.lineTo(left + bR, BASE_Y);
          ctx.arc(left + bR, BASE_Y - bR, bR, Math.PI / 2, Math.PI, false);
          ctx.closePath();
        }
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fillRect(left + 2, top + topR, 2.5, Math.max(0, h - topR - bR - 1));
        ctx.restore();
      }
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(scaleX, scaleY);
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-BALL_RADIUS * 0.26, -BALL_RADIUS * 0.28, BALL_RADIUS * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.fill();
      ctx.restore();
      ctx.restore();
      frame = requestAnimationFrame(render);
    }

    frame = requestAnimationFrame(render);
    stopRef.current = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [open]);

  return (
    <div
      id="globalPreloader"
      className={`fixed inset-0 z-[9999] flex-col items-center justify-center bg-black/50 backdrop-blur-xl transition-opacity duration-500 ease-in-out ${
        open ? "flex opacity-100" : "pointer-events-none hidden opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="mt-[-5%] flex select-none flex-col items-center justify-center pointer-events-none text-center">
        <canvas id="stairsCanvas" ref={canvasRef} className="scale-[0.65] transform sm:scale-75" />
        <h4 className="text-lg font-medium tracking-wide text-white -mt-2">{title}</h4>
        <p className="mt-1 text-xs font-light tracking-wider text-zinc-300 drop-shadow-md">{subtitle}</p>
      </div>
    </div>
  );
}
