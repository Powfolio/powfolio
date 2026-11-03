"use client";

export default function ShapeGridBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-50" aria-hidden>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(184,134,59,0.08) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(184,134,59,0.06) 0%, transparent 45%),
          linear-gradient(to right, rgba(184,134,59,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(184,134,59,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        animation: "shape-drift 28s linear infinite",
      }} />
      <style>{`
        @keyframes shape-drift {
          0% { background-position: 0 0, 0 0, 0 0, 0 0; }
          100% { background-position: 40px 20px, -30px 40px, 48px 48px, 48px 48px; }
        }
      `}</style>
    </div>
  );
}
