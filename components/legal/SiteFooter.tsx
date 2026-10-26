import Link from "next/link";
import { ChevronDown, Github, Mail } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import { SITE_NAME } from "@/lib/site";

const GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/faq", label: "Help center" },
      { href: "mailto:dev@powfolio.xyz?subject=API%20or%20development%20question", label: "API & development" },
      { href: "mailto:dev@powfolio.xyz?subject=Documentation%20question", label: "Documentation" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://x.com/powfolio_xyz", label: "X / Twitter", external: true },
      { href: "https://github.com/Dwise3310/pow3folio", label: "GitHub", external: true },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Legal & Support",
    links: [
      { href: "mailto:support@powfolio.xyz", label: "Support" },
      { href: "mailto:privacy@powfolio.xyz", label: "Privacy requests" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

const STACK = [
  { name: "WalletConnect", domain: "walletconnect.com", href: "https://walletconnect.com" },
  { name: "Alchemy", domain: "alchemy.com", href: "https://www.alchemy.com" },
  { name: "Reservoir", domain: "reservoir.tools", href: "https://reservoir.tools" },
  { name: "OpenSea", domain: "opensea.io", href: "https://opensea.io" },
  { name: "IPFS", domain: "ipfs.tech", href: "https://ipfs.tech" },
  { name: "Arweave", domain: "arweave.org", href: "https://www.arweave.org" },
  { name: "KiiChain", domain: "kiichain.io", href: "https://www.kiichain.io" },
  { name: "DEX Screener", domain: "dexscreener.com", href: "https://dexscreener.com" },
  { name: "Resend", domain: "resend.com", href: "https://resend.com" },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/70 bg-background">
      <div className="container-app px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <BrandMark href="/" />
          <p className="mt-5 max-w-lg text-sm leading-6 text-foreground-muted">
            A professional home for your proof of work, built to make real experience easier to discover and trust.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <a
              href="https://x.com/powfolio_xyz"
              target="_blank"
              rel="noreferrer"
              aria-label="POWFOLIO on X"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              <XIcon />
            </a>
            <a
              href="https://github.com/Dwise3310/pow3folio"
              target="_blank"
              rel="noreferrer"
              aria-label="POWFOLIO on GitHub"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="mailto:support@powfolio.xyz"
              aria-label="Email POWFOLIO support"
              className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav className="mx-auto mt-14 max-w-5xl" aria-label="Footer navigation">
          <div className="hidden grid-cols-4 gap-8 border-y border-border/70 py-10 md:grid">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">{group.title}</p>
                <ul className="mt-5 space-y-3.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <LinkOrAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-y border-border/70 md:hidden">
            {GROUPS.map((group) => (
              <details key={group.title} className="group border-b border-border/60 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {group.title}
                  <ChevronDown className="h-4 w-4 text-foreground-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="space-y-3 pb-5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <LinkOrAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </nav>

        <section className="mx-auto mt-14 max-w-5xl text-center" aria-labelledby="stack-heading">
          <p id="stack-heading" className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-subtle">
            Powering your Web3 stack
          </p>
          <div className="mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-10 sm:gap-y-6">
            {STACK.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.name}
                title={item.name}
                className="group grid h-10 w-10 place-items-center opacity-45 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 object-contain"
                />
              </a>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-border/70 pt-7">
          <div className="flex flex-col gap-4 text-xs text-foreground-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
              <span aria-hidden="true">•</span>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
              <span aria-hidden="true">•</span>
              <Link href="/cookies" className="transition-colors hover:text-foreground">Cookies</Link>
              <span aria-hidden="true">•</span>
              <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

function LinkOrAnchor({ link }: { link: FooterLink }) {
  const className = "text-sm text-foreground-muted transition-colors hover:text-foreground";
  if (link.external || link.href.startsWith("mailto:")) {
    return (
      <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined} className={className}>
        {link.label}
      </a>
    );
  }
  return <Link href={link.href} className={className}>{link.label}</Link>;
}
