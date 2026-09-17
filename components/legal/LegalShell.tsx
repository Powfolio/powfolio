import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import SiteFooter from "@/components/legal/SiteFooter";
import BackToTop from "@/components/ui/BackToTop";

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
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <span className="text-xs font-bold">P3</span>
            </div>
            <span className="truncate text-sm font-semibold">
              Pow<span className="text-primary">3</span>Folio
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="container-app max-w-2xl py-8 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">{kicker}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-foreground-muted">{intro}</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-foreground-muted">{children}</div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
