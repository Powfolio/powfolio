import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

const CONTACT = [
  { label: "Support", email: "support@powfolio.xyz" },
  { label: "Privacy", email: "privacy@powfolio.xyz" },
  { label: "Development", email: "dev@powfolio.xyz" },
];

const INTEGRATIONS = [
  { name: "WalletConnect", domain: "walletconnect.com", href: "https://walletconnect.com" },
  { name: "Alchemy", domain: "alchemy.com", href: "https://www.alchemy.com" },
  { name: "Reservoir", domain: "reservoir.tools", href: "https://reservoir.tools" },
  { name: "OpenSea", domain: "opensea.io", href: "https://opensea.io" },
  { name: "Gemini", domain: "ai.google.dev", href: "https://ai.google.dev" },
  { name: "IPFS", domain: "ipfs.tech", href: "https://ipfs.tech" },
  { name: "Arweave", domain: "arweave.org", href: "https://www.arweave.org" },
  { name: "KiiChain", domain: "kiichain.io", href: "https://www.kiichain.io" },
  { name: "DEX Screener", domain: "dexscreener.com", href: "https://dexscreener.com" },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-background">
      <div className="container-app py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <BrandMark href="/" />
            <p className="mt-4 max-w-md text-sm leading-6 text-foreground-muted">
              A professional home for your proof of work, built to make real experience easier to discover and trust.
            </p>
            <a
              href="https://x.com/powfolio_xyz"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
              aria-label="POWFOLIO on X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow @powfolio_xyz
            </a>
          </div>

          <div className="lg:justify-self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-subtle">Explore</p>
            <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label="Footer navigation">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-foreground-muted transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="my-12 h-px bg-border/60 sm:my-14" />

        <section aria-labelledby="integrations-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-subtle">Technology & data</p>
              <h2 id="integrations-heading" className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Built with a connected Web3 stack
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-foreground-muted sm:text-right">
              POWFOLIO connects with established networks, APIs, and data services to keep profiles and onchain features useful.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {INTEGRATIONS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface/70 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                    alt=""
                    width={22}
                    height={22}
                    loading="lazy"
                    className="h-5 w-5 object-contain"
                  />
                </span>
                <span className="min-w-0 text-sm font-medium text-foreground-muted transition-colors group-hover:text-foreground">
                  {item.name}
                </span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-foreground-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <div className="my-12 h-px bg-border/60 sm:my-14" />

        <section aria-labelledby="footer-contact-heading" className="rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="footer-contact-heading" className="text-sm font-semibold text-foreground">Need to reach us?</h2>
                <p className="mt-1 text-sm text-foreground-muted">Choose the inbox that matches what you need.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {CONTACT.map((item) => (
                <a
                  key={item.email}
                  href={`mailto:${item.email}`}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-hover"
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">{item.label}</span>
                  <span className="mt-1 block text-xs font-medium text-foreground-muted">{item.email}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4 text-xs text-foreground-subtle sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {SITE_NAME}</span>
            <span aria-hidden="true">·</span>
            <span>Proof, not promises.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-foreground">Cookies</Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
