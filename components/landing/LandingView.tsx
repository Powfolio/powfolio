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
  { label: "Proof tabs", value: "6" },
  { label: "Public scores", value: "2" },
  { label: "AI assistant", value: "Live" },
  { label: "Public URL", value: "Yours" },
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
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.05] dark:opacity-[0.08]" style={{ backgroundSize: "40px 40px" }} aria-hidden />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[26rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" aria-hidden />
      <LandingNav signedIn={signedIn} active={focus} />
      <main id="main" className="relative z-10">
        <section className="container-app pb-14 pt-16 sm:pb-20 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-reveal landing-delay-1 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground-subtle">Live scores · real proof · one public link</p>
            <h1 className="landing-reveal landing-delay-2 mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">Your Web3 work. <span className="hero-gradient-text">Verified. Visible.</span></h1>
            <p className="landing-reveal landing-delay-3 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-[1.05rem]">Stop scattering trades, threads, and roles across ten apps. One public Powfolio with scores that reflect evidence. Built for people who ship, not just claim.</p>
            <div className="landing-reveal landing-delay-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <a href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">Open dashboard</a>
              ) : (
                <a href="/signup" className="btn-primary px-5 py-2.5 text-sm">Create free profile</a>
              )}
              <a href="/faq" className="btn-ghost px-4 py-2 text-sm">Read the FAQ</a>
            </div>
            <dl className="landing-reveal landing-delay-5 mx-auto mt-14 grid max-w-lg grid-cols-2 gap-y-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <div className="marquee-wrap landing-reveal landing-delay-6 mb-16 border-y border-border/30">
          <div className="marquee-track">
            {[...ROLES, ...ROLES].map((role, i) => (
              <span key={`${role}-${i}`} className="marquee-item flex items-center gap-2">
                <span className="text-primary">◆</span> {role}
              </span>
            ))}
          </div>
        </div>
        <FeatureScroller />
        <section className="container-app pb-20 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground-subtle">Why this exists</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your work is real. Most profiles still look like claims.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-10 sm:grid-cols-3">
            {GAPS.map((x, i) => (
              <div key={x.t}>
                <p className="text-xs font-medium tracking-[0.18em] text-primary">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="how" className="container-app scroll-mt-20 pb-20 sm:pb-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground-subtle">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Four steps. Built for people who ship.</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">No extra stack. Set the page up, put the work on it, let the scores move, then share one link.</p>
          </div>
          <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.step}>
                <p className="text-xs font-medium tracking-[0.18em] text-primary">{s.step}</p>
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
