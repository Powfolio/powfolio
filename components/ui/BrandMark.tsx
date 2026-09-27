import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mark.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 object-contain"
      />
      {!markOnly && (
        <span className={`truncate font-semibold tracking-tight ${compact ? "text-sm" : "text-base"}`}>
          {name}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </Link>
  );
}
