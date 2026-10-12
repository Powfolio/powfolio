"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-start justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400/80">Powfolio</p>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">This page hit a problem</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
        The page stopped instead of leaving you on a blank screen. Retry it, or go back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => reset()} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Try again
        </button>
        <a href="/dashboard" className="rounded-full border border-border px-4 py-2 text-sm text-foreground">
          Dashboard
        </a>
      </div>
    </main>
  );
}
