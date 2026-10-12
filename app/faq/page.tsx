import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import SiteFooter from "@/components/legal/SiteFooter";
import BackToTop from "@/components/ui/BackToTop";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FAQ",
  description: "What Powfolio is, how Profile Score and Builder Score work, and how the public page and CV stay under your control.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: string }[] = [
  { q: "What is Powfolio?", a: "Powfolio is a public proof-of-work profile built for Web3 builders, traders, researchers, community leads, airdrop hunters, and developers. Instead of screenshots scattered across X, Discord, and Notion, everything lives at one clean link: your trades, writing, community work, airdrops, credentials, and onchain activity." },
  { q: "What is Profile Score?", a: "Profile Score (0 to 100) measures how complete and polished your profile is; your identity details, how much you've filled in About, whether your skills have real descriptions, your work and education history, your connections, and whether your proof sections actually have content in them. It's about how well you've set things up, not how impressive the work itself is." },
  { q: "What is Builder Score?", a: "Builder Score (0 to 100) measures actual evidence of your craft: technical writing, trading logs and platforms, community roles, onchain and airdrop activity, and linked work history. The more real, verified proof you add, the higher it climbs. Profile Score asks \"did you fill this out well.\" Builder Score asks \"can you back it up.\"" },
  { q: "How do I make a tab public or private?", a: "You're in control of what shows up on your public profile. In your dashboard, use the section visibility toggles to turn Writing, Trading, Community, Airdrops, and Onchain on or off. About always stays visible, since it's the core of your profile." },
  { q: "How do skill pillars work?", a: "Each skill pillar is a name plus a short brief, up to 250 characters. On your public About tab, they show up as compact chips, tap one to read the full description, tap outside to close it again." },
  { q: "Can people download my CV from my public page?", a: "No. Download CV lives in the dashboard at the resume page. It prints as {username} PowFolio.pdf in Editorial or Classic. Visitors cannot download it from the public page." },
  { q: "What is work experience limited to?", a: "There is no five-entry cap. Each role needs a company or project, a role, full-time or part-time, dates, and a company link. Achievement lines are optional and print on the CV." },
  { q: "Where is my public link?", a: "Once you've set a username and made your profile public, your public Powfolio is your username on this site. That's the one link you can drop in a bio or a DM." },
  { q: "What is Pow3Bot?", a: "Pow3Bot is your in-product assistant, built specifically for Powfolio. It helps with setup, wording, understanding your scores, and general how-tos. It won't give investment advice, and it doesn't know anything about other apps." },
  { q: "Can I hide my email?", a: "You can hide any of your email addresses, but at least one email address must remain visible on your public profile." },
];

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav signedIn={Boolean(user)} active="faq" />
      <main id="main" className="container-app max-w-2xl py-10 sm:py-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-subtle">Help</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">FAQ</h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">Short answers. For a live walkthrough, open Pow3Bot.</p>
        <div className="mt-8 divide-y divide-border/40 border-y border-border/40">
          {FAQS.map((item) => (
            <details key={item.q} className="faq-item py-4">
              <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-medium tracking-tight">
                <span>{item.q}</span>
                <span className="faq-mark mt-0.5 text-lg leading-none" aria-hidden>+</span>
              </summary>
              <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-foreground-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
