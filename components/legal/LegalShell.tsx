import ThemeToggle from "@/components/theme/ThemeToggle";
import SiteFooter from "@/components/legal/SiteFooter";
import BackToTop from "@/components/ui/BackToTop";
import BrandMark from "@/components/ui/BrandMark";
import Link from "next/link";

export default function LegalShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container-app flex h-14 items-center justify-between gap-2">
          <BrandMark compact />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="container-app max-w-3xl py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">{kicker}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">{intro}</p>
          <nav aria-label="Legal pages" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-foreground-subtle">
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-foreground">Cookies</Link>
          </nav>
        </div>
        <div className="mt-10 max-w-2xl space-y-8 text-sm leading-7 text-foreground-muted sm:mt-12">{children}</div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
