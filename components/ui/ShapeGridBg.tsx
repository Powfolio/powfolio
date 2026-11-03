"use client";

import { useEffect, useState } from "react";

export default function ShapeGridBg() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      setMouse({
        x: Math.max(0, Math.min(1, e.clientX / w)),
        y: Math.max(0, Math.min(1, e.clientY / h)),
      });
      setActive(true);
    };
    const onLeave = () => setActive(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft radial glows that follow cursor */}
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
        const pull = active ? influence * 22 : 0;
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
              transform: `translate(${dx * pull}px, ${dy * pull}px) scale(${1 + glow * 0.7})`,
              opacity: 0.22 + glow * 0.6,
              boxShadow: glow > 0.25 ? `0 0 ${10 + glow * 18}px rgba(184,134,59,${0.45 + glow * 0.35})` : "none",
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
