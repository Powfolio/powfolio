import FeatureScroller from "@/components/landing/FeatureScroller";
import LandingFocus from "@/components/landing/LandingFocus";
import LandingNav from "@/components/landing/LandingNav";
import ProofCta from "@/components/landing/ProofCta";
import JsonLd from "@/components/legal/JsonLd";
import SiteFooter from "@/components/legal/SiteFooter";
import CursorGrid from "@/components/ui/CursorGrid";
import TechText from "@/components/ui/TechText";
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
      <CursorGrid cellSize={64} color="#B8863B" gridColor="#B8863B" radius={160} />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.035] dark:opacity-[0.055]" style={{ backgroundSize: "48px 48px" }} aria-hidden />
      <LandingNav signedIn={signedIn} />
      <main id="main" className="relative z-10">
        <section className="relative isolate min-h-[85vh] overflow-hidden">
          <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center sm:pt-32">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/10 px-2.5 py-1.5 ring-1 ring-white/15 backdrop-blur">
              <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-black">Live</span>
              <span className="text-sm font-medium text-white/90">Proof of work. One public link.</span>
            </div>
            <div className="h-[140px] w-full sm:h-[180px]">
              <TechText text="Your Web3 work." fontSize={110} fontWeight={600} color="#ffffff" accentColor="#B8863B" reveal="letter" dashLength={4} dashGap={2} specks={12} />
            </div>
            <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Trades, threads, roles, and onchain activity in one public page. Scores that move with evidence, not slogans.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              {signedIn ? (
                <a href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-primary/90">
                  Open dashboard
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              ) : (
                <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-primary/90">
                  Create free profile
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              )}
              <a href="/#features" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:text-white">
                See the proof sections
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
              </a>
            </div>
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
        <section aria-labelledby="audience-heading" className="container-app pb-20 sm:pb-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground-subtle">One portfolio, real evidence</p>
            <h2 id="audience-heading" className="mt-3 text-center text-[1.7rem] font-semibold tracking-tight sm:text-4xl">A professional portfolio built around what you can prove.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-foreground-muted">
              Powfolio is a proof of work portfolio and public talent profile for people building online. Bring your projects, writing, skills, work history, and credentials into one shareable profile. Whether your work is in Web3 or a broader digital career, use it as a Web3 CV or trader portfolio, with relevant airdrop activity and NFT collectibles supporting your wider airdrop portfolio or NFT portfolio.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/50 p-5">
                <h3 className="text-base font-semibold">For Web3 and onchain talent</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  Build a Web3 portfolio, crypto portfolio, or onchain resume with space for trading records, airdrop activity, collectibles, community roles, and project contributions. Make your work easier to review than a scattered list of links.
                </p>
              </div>
              <div className="rounded-xl border border-border/50 p-5">
                <h3 className="text-base font-semibold">For independent professionals</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  Present writing, research, skills, projects, and experience in a professional talent profile. Use it as a writing portfolio, community portfolio, builder profile, or a shareable alternative to a traditional CV.
                </p>
              </div>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-foreground-muted">
              Profile Score reflects profile completeness. Builder Score reflects the evidence you add. These scores help organize your profile; they are not a guarantee of hiring, trading performance, or independent verification of every claim.
            </p>
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
