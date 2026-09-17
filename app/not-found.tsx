import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <span className="text-sm font-bold">P3</span>
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">This page is not here</h1>
      <p className="mt-3 max-w-md text-sm text-foreground-muted">
        The link may be wrong, or the profile is private or deleted. Head back to the homepage or create your own proof link.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary text-sm">
          Home
        </Link>
        <Link href="/faq" className="btn-secondary text-sm">
          FAQ
        </Link>
      </div>
    </div>
  );
}
