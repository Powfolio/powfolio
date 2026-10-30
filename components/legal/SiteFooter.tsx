import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";
import BrandMark from "@/components/ui/BrandMark";
import { SITE_NAME } from "@/lib/site";

const GROUPS = [
  {
    title: "Resources",
    links: [
      { href: "https://whitepaper.powfolio.xyz", label: "White paper", external: true },
      { href: "/contact", label: "Help center" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal & Support",
    links: [
      { href: "/contact", label: "Support" },
      { href: "mailto:privacy@powfolio.xyz", label: "Privacy requests" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookie policy" },
    ],
  },
];

const STACK = [
  { name: "WalletConnect", domain: "walletconnect.com", href: "https://walletconnect.com" },
  { name: "Alchemy", domain: "alchemy.com", href: "https://www.alchemy.com" },
  { name: "Reservoir", domain: "reservoir.tools", href: "https://reservoir.tools" },
  { name: "OpenSea", domain: "opensea.io", href: "https://opensea.io" },
  { name: "IPFS", icon: "https://cdn.simpleicons.org/ipfs", href: "https://ipfs.tech" },
  { name: "KiiChain", domain: "kiichain.io", href: "https://kiichain.io" },
  { name: "DEX Screener", icon: "https://brandlogos.sgp1.digitaloceanspaces.com/svg/arcticons/dex-screener.svg", href: "https://dexscreener.com" },
  { name: "Resend", domain: "resend.com", href: "https://resend.com" },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M19.7 5.3a18.4 18.4 0 0 0-4.5-1.4l-.6 1.2a16.8 16.8 0 0 0-5.2 0l-.6-1.2a18.4 18.4 0 0 0-4.5 1.4C1.5 9.5.7 13.6 1.1 17.6a18.5 18.5 0 0 0 5.5 2.8l1.2-1.9-1.8-.9.4-.3c3.5 1.6 7.3 1.6 10.8 0l.4.3-1.8.9 1.2 1.9a18.5 18.5 0 0 0 5.5-2.8c.5-4.7-.8-8.7-2.8-12.3ZM8.7 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8 0 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="grid h-9 w-9 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground">
      {children}
    </Link>
  );
}

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/70 bg-background">
      <div className="container-app px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
        <div className="flex flex-col items-center text-center">
          <BrandMark href="/" />
          <p className="mt-3 max-w-lg text-sm leading-6 text-foreground-muted">
            A professional home for your proof of work, built to make real experience easier to discover and trust.
          </p>
          <div className="mt-3 flex items-center gap-1">
            <SocialLink href="https://x.com/powfolio_xyz" label="POWFOLIO on X"><XIcon /></SocialLink>
            <SocialLink href="https://discord.gg/gnQBN5cN9" label="POWFOLIO on Discord"><DiscordIcon /></SocialLink>
            <a href="mailto:support@powfolio.xyz" aria-label="Email support" className="grid h-9 w-9 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground"><Mail className="h-4 w-4" aria-hidden="true" /></a>
          </div>
        </div>

        <nav className="mx-auto mt-7 max-w-5xl" aria-label="Footer navigation">
          <div className="hidden grid-cols-2 gap-8 border-y border-border/70 py-6 md:grid md:grid-cols-2">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">{group.title}</p>
                <ul className="mt-3 space-y-2">{group.links.map((link) => <li key={`${group.title}-${link.label}`}><LinkOrAnchor link={link} /></li>)}</ul>
              </div>
            ))}
          </div>

          <div className="border-y border-border/70 md:hidden">
            {GROUPS.map((group) => (
              <details key={group.title} className="group border-b border-border/60 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {group.title}<ChevronDown className="h-4 w-4 text-foreground-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="space-y-2 pb-3">{group.links.map((link) => <li key={`${group.title}-${link.label}`}><LinkOrAnchor link={link} /></li>)}</ul>
              </details>
            ))}
          </div>
        </nav>

        <section className="mx-auto mt-7 max-w-5xl text-center" aria-labelledby="stack-heading">
          <p id="stack-heading" className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground-subtle">Powering your Web3 stack</p>
          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-8">
            {STACK.map((item) => (
              <a key={item.name} href={item.href} target="_blank" rel="noreferrer" aria-label={item.name} title={item.name} className={`grid h-7 w-7 place-items-center opacity-55 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0 ${item.name === "DEX Screener" ? "rounded-full bg-white p-1" : ""}`}>
                <img src={"icon" in item ? item.icon : `https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 object-contain" />
              </a>
            ))}
          </div>
        </section>

        <div className="mt-7 border-t border-border/70 pt-4">
          <div className="flex flex-col gap-2 text-xs text-foreground-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link><span aria-hidden="true">•</span>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link><span aria-hidden="true">•</span>
              <Link href="/cookies" className="transition-colors hover:text-foreground">Cookies</Link><span aria-hidden="true">•</span>
              <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = { href: string; label: string; external?: boolean };

function LinkOrAnchor({ link }: { link: FooterLink }) {
  const className = "text-sm text-foreground-muted transition-colors hover:text-foreground";
  if (link.external || link.href.startsWith("mailto:")) return <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined} className={className}>{link.label}</a>;
  return <Link href={link.href} className={className}>{link.label}</Link>;
}
