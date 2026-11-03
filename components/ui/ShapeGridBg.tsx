"use client";

import { useEffect, useRef, useState } from "react";

export default function ShapeGridBg() {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
      setActive(true);
    };
    const onLeave = () => setActive(false);

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const dots = Array.from({ length: 18 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return {
      id: i,
      baseX: 10 + col * 16,
      baseY: 18 + row * 28,
      size: 5 + (i % 4) * 2,
    };
  });

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Soft radial glows that follow cursor lightly */}
      <div
        className="absolute h-[70vh] w-[70vw] rounded-full bg-primary/12 blur-3xl transition-all duration-700 ease-out"
        style={{
          left: `${mouse.x * 60 - 20}%`,
          top: `${mouse.y * 50 - 15}%`,
          transform: active ? "scale(1.15)" : "scale(1)",
          opacity: active ? 0.7 : 0.4,
        }}
      />
      <div
        className="absolute h-[50vh] w-[50vw] rounded-full bg-primary/8 blur-3xl transition-all duration-1000 ease-out"
        style={{
          right: `${(1 - mouse.x) * 40}%`,
          bottom: `${(1 - mouse.y) * 30}%`,
          opacity: active ? 0.5 : 0.25,
        }}
      />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 opacity-25 dark:opacity-35"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(184,134,59,0.14) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(184,134,59,0.14) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          animation: "grid-shift 48s linear infinite",
        }}
      />

      {/* Interactive dots with soft physics */}
      {dots.map((d) => {
        const dx = (mouse.x * 100 - d.baseX) / 100;
        const dy = (mouse.y * 100 - d.baseY) / 100;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 2.2);
        const pull = active ? influence * 18 : 0;
        const glow = active ? influence : 0;

        return (
          <span
            key={d.id}
            className="absolute block rounded-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: d.size,
              height: d.size,
              left: `${d.baseX}%`,
              top: `${d.baseY}%`,
              transform: `translate(${dx * pull}px, ${dy * pull}px) scale(${1 + glow * 0.6})`,
              opacity: 0.25 + glow * 0.55,
              boxShadow: glow > 0.3 ? `0 0 ${8 + glow * 16}px rgba(184,134,59,${0.4 + glow * 0.4})` : "none",
            }}
          />
        );
      })}

      <style>{`
        @keyframes grid-shift {
          0% { background-position: 0 0; }
          100% { background-position: 56px 56px; }
        }
      `}</style>
    </div>
  );
}
