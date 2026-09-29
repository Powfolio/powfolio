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
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#B8863B] text-[13px] font-bold leading-none text-[#0D0D0C]"
      >
        P
      </span>
      {!markOnly && (
        <span className={`truncate font-semibold tracking-tight ${compact ? "text-sm" : "text-base"}`}>
          {name}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </Link>
  );
}
