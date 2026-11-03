"use client";

export default function LatticeLoader({ label = "Reading onchain footprint", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-sm text-foreground-muted ${className}`}>
      <span className="grid grid-cols-3 gap-0.5" style={{ width: 20, height: 20 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="block rounded-[2px] bg-primary"
            style={{
              opacity: 0.25,
              animation: `lattice-pulse 1.1s ease-in-out infinite`,
              animationDelay: `${(i % 3) * 0.12 + Math.floor(i / 3) * 0.08}s`,
            }}
          />
        ))}
      </span>
      <span>{label}</span>
      <style>{`
        @keyframes lattice-pulse {
          0%, 100% { opacity: 0.22; }
          40%, 60% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}
