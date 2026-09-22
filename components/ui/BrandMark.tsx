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
      {markOnly ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/brand/mark.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/brand/wordmark.svg"
          alt={wordmark || SITE_NAME}
          width={200}
          height={36}
          className={`shrink-0 object-contain object-left ${compact ? "h-7 w-auto max-w-[148px]" : "h-8 w-auto max-w-[196px]"}`}
        />
      )}
      {markOnly && <span className="sr-only">{SITE_NAME}</span>}
    </Link>
  );
}
