"use client";

import Link from "next/link";
import { useBrand } from "@/components/ui/BrandProvider";
import { SITE_NAME } from "@/lib/site";

export function SiteLogo({ className = "" }: { className?: string }) {
  const seed = useBrand();
  if (!seed.logo_url) return <span className="site-logo" aria-hidden />;
  return <img src={seed.logo_url} alt="" className={`site-logo ${className}`} />;
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
