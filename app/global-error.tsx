"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0c1110", color: "#f4f1ea", fontFamily: "sans-serif" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#c4a574", fontSize: 12 }}>Powfolio</p>
          <h1 style={{ fontSize: 28, margin: "12px 0 8px" }}>The app hit a problem</h1>
          <p style={{ color: "#b7b1a6", lineHeight: 1.5 }}>
            Something failed before the page could render. Retry, or open the dashboard.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="button" onClick={() => reset()} style={{ background: "#c4a574", color: "#12201a", border: 0, borderRadius: 999, padding: "8px 16px", fontWeight: 650 }}>
              Try again
            </button>
            <a href="/dashboard" style={{ color: "#f4f1ea", border: "1px solid #3a3a3a", borderRadius: 999, padding: "8px 16px", textDecoration: "none" }}>
              Dashboard
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
