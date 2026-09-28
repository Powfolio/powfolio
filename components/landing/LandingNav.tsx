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
  function linkClass(href: string) {
    const on = active && href === `/${active}`;
    return `rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
      on ? "text-foreground" : "text-foreground-muted hover:text-foreground"
    }`;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/25 bg-background/78 backdrop-blur-xl">
      <div className="container-app flex h-14 items-center justify-between gap-3">
        <BrandMark compact href="/" />
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Landing">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-xs">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-2.5 py-1.5 text-xs">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary px-3 py-1.5 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="container-app flex h-10 items-center gap-1 overflow-x-auto md:hidden" aria-label="Landing sections">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass(link.href)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
