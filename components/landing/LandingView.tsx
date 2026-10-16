import FeatureScroller from "@/components/landing/FeatureScroller";
import LandingFocus from "@/components/landing/LandingFocus";
import LandingNav from "@/components/landing/LandingNav";
import ProofCta from "@/components/landing/ProofCta";
import JsonLd from "@/components/legal/JsonLd";
import SiteFooter from "@/components/legal/SiteFooter";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  { step: "01", title: "Create your profile", desc: "Pick a username, write a short bio, add skills and a wallet. You get one public URL that stays yours." },
  { step: "02", title: "Add the work", desc: "Trades, writing, community roles, airdrops, collectibles. Turn each section on when it is ready to show." },
  { step: "03", title: "Raise the scores", desc: "Profile Score tracks setup. Builder Score tracks evidence. Both move when you add real work, not slogans." },
  { step: "04", title: "Share the link", desc: "Drop one URL in bios, DMs, and applications. Reviewers open it and see the record, not a claim." },
];

const STATS = [
  { label: "Proof sections", value: "6" },
  { label: "Public scores", value: "2" },
  { label: "Assistant", value: "Live" },
  { label: "Your URL", value: "Yours" },
];

const ROLES = ["Traders", "Researchers", "Community Leads", "Airdrop Hunters", "Builders", "Mods", "Onchain Analysts", "Campaign Managers"];

const GAPS = [
  { t: "Scattered proof", d: "Trades on one app, threads on X, roles in Discord. A hiring lead should not have to hunt." },
  { t: "Soft resumes", d: "Titles without charts, links, or campaign history do not hold up when someone checks." },
  { t: "No single home", d: "Good work stays hard to read without one public page you control and keep current." },
];

export default async function LandingView({ focus }: { focus?: "features" | "how" | "faq" }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <JsonLd />
      <LandingFocus target={focus} />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.035] dark:opacity-[0.055]" style={{ backgroundSize: "48px 48px" }} aria-hidden />
      <LandingNav signedIn={signedIn} active={focus} />
      <main id="main" className="relative z-10">
        <section className="container-app pb-12 pt-14 sm:pb-20 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-reveal landing-delay-1 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-subtle">Live scores · real proof · one public link</p>
            <h1 className="landing-reveal landing-delay-2 mt-5 text-[2.15rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.35rem]">
              Your Web3 work.
              <span className="mt-1 block hero-gradient-text font-semibold">Verified. Visible.</span>
            </h1>
            <p className="landing-reveal landing-delay-3 mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-foreground-muted sm:text-base">
              Trades, threads, roles, and onchain activity in one public page. Scores that move with evidence, not slogans.
            </p>
            <div className="landing-reveal landing-delay-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <a href="/dashboard" className="btn-primary w-full max-w-xs px-5 py-2.5 text-sm sm:w-auto">Open dashboard</a>
              ) : (
                <a href="/signup" className="btn-primary w-full max-w-xs px-5 py-2.5 text-sm sm:w-auto">Create free profile</a>
              )}
              <a href="/#features" className="btn-ghost px-4 py-2 text-sm">See the proof sections</a>
            </div>
            <dl className="landing-reveal landing-delay-5 mx-auto mt-14 grid max-w-lg grid-cols-2 gap-y-7 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <div className="marquee-wrap landing-reveal landing-delay-6 mb-14 border-y border-border/25">
          <div className="marquee-track">
            {[...ROLES, ...ROLES].map((role, i) => (
              <span key={`${role}-${i}`} className="marquee-item flex items-center gap-2">
                <span className="text-primary/80">◆</span> {role}
              </span>
            ))}
          </div>
        </div>
        <FeatureScroller />
        <section className="container-app pb-20 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-subtle">Why this exists</p>
            <h2 className="mt-3 text-[1.7rem] font-semibold tracking-tight sm:text-4xl">Your work is real. Most profiles still look like claims.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-10 sm:grid-cols-3">
            {GAPS.map((x, i) => (
              <div key={x.t}>
                <p className="text-xs font-medium tracking-[0.16em] text-primary">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="how" className="container-app scroll-mt-20 pb-20 sm:pb-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-subtle">How it works</p>
            <h2 className="mt-3 text-[1.7rem] font-semibold tracking-tight sm:text-4xl">Four steps. Built for people who ship.</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">Set the page up, put the work on it, let the scores move, then share one link.</p>
          </div>
          <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.step}>
                <p className="text-xs font-medium tracking-[0.16em] text-primary">{s.step}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>
        <ProofCta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}
