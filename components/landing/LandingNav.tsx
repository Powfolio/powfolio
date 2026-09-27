import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BrandMark from "@/components/ui/BrandMark";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export default function LandingNav({
  signedIn = false,
  active,
}: {
  signedIn?: boolean;
  active?: "features" | "how" | "faq";
}) {
  function linkClass(href: string, compact = false) {
    const on = active && href === `/${active}`;
    return `${compact ? "text-[11px]" : "rounded-md px-3 py-1.5 text-xs"} font-medium transition-colors ${
      on ? "text-foreground" : "text-foreground-muted hover:text-foreground"
    }`;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container-app flex h-14 items-center justify-between gap-2">
        <BrandMark compact href="/" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Landing">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-xs">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden text-xs sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3 py-1.5 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="container-app flex h-10 items-center gap-4 md:hidden" aria-label="Landing sections">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass(link.href, true)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
