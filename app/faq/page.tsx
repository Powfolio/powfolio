import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import SiteFooter from "@/components/legal/SiteFooter";
import BackToTop from "@/components/ui/BackToTop";

export const metadata: Metadata = {
  title: "FAQ",
  description: "What Pow3Folio is, how Profile Score and Builder Score work, and how public profiles stay under your control.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Pow3Folio?",
    a: "Pow3Folio is a public proof-of-work profile built for Web3 builders, traders, researchers, community leads, airdrop hunters, and developers. Instead of screenshots scattered across X, Discord, and Notion, everything lives at one clean link: your trades, writing, community work, airdrops, credentials, and onchain activity.",
  },
  {
    q: "What is Profile Score?",
    a: "Profile Score (0 to 100) measures how complete and polished your profile is; your identity details, how much you've filled in About, whether your skills have real descriptions, your work and education history, your connections, and whether your proof sections actually have content in them. It's about how well you've set things up, not how impressive the work itself is.",
  },
  {
    q: "What is Builder Score?",
    a: "Builder Score (0 to 100) measures actual evidence of your craft: technical writing, trading logs and platforms, community roles, onchain and airdrop activity, and linked work history. The more real, verified proof you add, the higher it climbs. Profile Score asks \"did you fill this out well.\" Builder Score asks \"can you back it up.\"",
  },
  {
    q: "How do I make a tab public or private?",
    a: "You're in control of what shows up on your public profile. In your dashboard, use the section visibility toggles to turn Writing, Trading, Community, Airdrops, and Onchain on or off. About always stays visible, since it's the core of your profile.",
  },
  {
    q: "How do skill pillars work?",
    a: "Each skill pillar is a name plus a short brief, up to 250 characters. On your public About tab, they show up as compact chips, tap one to read the full description, tap outside to close it again.",
  },
  {
    q: "Can people download my CV from my public page?",
    a: "No, that stays private to you. The Download CV option lives in your dashboard, and it turns the information you've already added into a clean, professional PDF. Skill-specific export versions are on the way.",
  },
  {
    q: "What is work experience limited to?",
    a: "Up to 5 entries. Each one can include a company or project, your role, whether it was full-time or part-time, dates, a short description, and a link if you've got one.",
  },
  {
    q: "Where is my public link?",
    a: "Once you've set a username and made your profile public, it's yours at pow3folio.vercel.app/your_username. That's the one link you can drop anywhere; your bio, your DMs, wherever.",
  },
  {
    q: "What is Pow3Bot?",
    a: "Pow3Bot is your in-product assistant, built specifically for Pow3Folio. It helps with setup, wording, understanding your scores, and general how-tos. It won't give investment advice, and it doesn't know anything about other apps.",
  },
  {
    q: "Can I hide my email?",
    a: "You can hide any of your email addresses, but at least one email address must remain visible on your public profile.",
  },
];

export default function FaqPage() {
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
          <div className="flex items-center gap-2">
            <Link href="/signup" className="btn-primary hidden text-xs sm:inline-flex">
              Get started
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="container-app max-w-2xl py-8 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">Help</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Product answers for builders. For live help, open Pow3Bot.
        </p>
        <ul className="mt-8 space-y-3">
          {FAQS.map((item) => (
            <li key={item.q} className="card p-0">
              <details className="group">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none">
                  <span className="flex items-start justify-between gap-3">
                    {item.q}
                    <span className="text-foreground-subtle transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-foreground-muted">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
