import Link from "next/link";
import BrandMark from "@/components/ui/BrandMark";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/signup", label: "Get started" },
  { href: "/login", label: "Log in" },
];

const CONTACT = [
  { label: "Privacy", email: "privacy@powfolio.xyz" },
  { label: "Support", email: "support@powfolio.xyz" },
  { label: "Dev", email: "dev@powfolio.xyz" },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/30">
      <div className="container-app py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-foreground-subtle">Built with</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a href="https://x.com/powfolio_xyz" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground-subtle hover:text-foreground" aria-label="Powfolio on X">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <span className="text-xs text-foreground-subtle">X · GitHub · Discord · Telegram · Solana · KiiChain · Google · Arkham</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark markOnly href="/" />
            <span className="text-xs text-foreground-subtle">© {new Date().getFullYear()} {SITE_NAME}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-foreground-subtle hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-foreground-subtle">
          {CONTACT.map((c) => (
            <a key={c.email} href={`mailto:${c.email}`} className="hover:text-foreground">
              {c.label}: {c.email}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
