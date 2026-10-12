"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";

export function SiteLogo({ className = "" }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => { if (on) setSrc(d.logo_url || null); })
      .catch(() => undefined);
    return () => { on = false; };
  }, []);
  if (src) {
    return <img src={src} alt="" className={`site-logo ${className}`} />;
  }
  return <span className={`site-logo-fallback ${className}`} aria-hidden>P</span>;
}

export default function BrandMark({
  compact = false,
  href = "/",
  wordmark,
  markOnly = false,
}: {
  compact?: boolean;
  href?: string;
  wordmark?: string;
  markOnly?: boolean;
}) {
  const name = wordmark || SITE_NAME;
  return (
    <Link href={href} prefetch={false} className="flex items-center gap-2 min-w-0 group">
      <SiteLogo />
      {wordmark && wordmark !== SITE_NAME && (
        <span className={`truncate font-semibold tracking-tight ${compact ? "text-sm" : "text-base"}`}>
          {wordmark}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </Link>
  );
}
