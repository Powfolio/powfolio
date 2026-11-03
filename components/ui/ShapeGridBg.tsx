"use client";

export default function ShapeGridBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft radial glows */}
      <div className="absolute -left-1/4 top-0 h-[60vh] w-[60vw] rounded-full bg-primary/10 blur-3xl" style={{ animation: "glow-drift 18s ease-in-out infinite" }} />
      <div className="absolute -right-1/4 bottom-0 h-[50vh] w-[50vw] rounded-full bg-primary/8 blur-3xl" style={{ animation: "glow-drift 22s ease-in-out infinite reverse" }} />
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-30 dark:opacity-40" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(184,134,59,0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(184,134,59,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "56px 56px",
        animation: "grid-shift 40s linear infinite",
      }} />
      {/* Floating dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute block rounded-full bg-primary/40"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            left: `${8 + (i * 7) % 84}%`,
            top: `${12 + (i * 11) % 76}%`,
            animation: `float-dot ${14 + (i % 5) * 2}s ease-in-out infinite`,
            animationDelay: `${-i * 0.8}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes glow-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, 6%) scale(1.08); }
        }
        @keyframes grid-shift {
          0% { background-position: 0 0; }
          100% { background-position: 56px 56px; }
        }
        @keyframes float-dot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-18px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
