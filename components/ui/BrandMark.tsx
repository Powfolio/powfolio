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
  return (
    <Link href={href} prefetch={false} className="flex items-center gap-2 min-w-0 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 object-contain"
      />
      {!markOnly && (
        <span className={`font-semibold truncate ${compact ? "text-sm sm:text-base" : ""}`}>
          {wordmark || SITE_NAME}
        </span>
      )}
      {markOnly && <span className="sr-only">{SITE_NAME}</span>}
    </Link>
  );
}
