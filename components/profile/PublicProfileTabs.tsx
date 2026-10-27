"use client";

import { useEffect, useState } from "react";
import ShareButton from "@/components/writing/ShareButton";
import TradeCard from "@/components/trading/TradeCard";
import CommunityCard from "@/components/community/CommunityCard";
import AirdropCard from "@/components/airdrops/AirdropCard";
import PlatformLogo from "@/components/ui/PlatformLogo";
import TradeImageCarousel from "@/components/trading/TradeImageCarousel";
import CredentialThumb from "@/components/profile/CredentialThumb";
import OnchainSection from "@/components/profile/OnchainSection";
import type {
  Writing, Trade, TradeUpdate, CommunityItem, Airdrop, Collectible, Credential, Skill, WorkExperience, Education, TradingPlatform,
} from "@/types/database";

const ABOUT_LIMIT = 435;

function AboutCopy({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.trim().length > ABOUT_LIMIT;
  const preview = long ? text.trim().slice(0, ABOUT_LIMIT).trimEnd() : text;
  return (
    <div>
      <h3 className="public-section-title">About</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words text-foreground">
        {open || !long ? text : preview}
        {!open && long ? "..." : ""}
        {long && (
          <button type="button" className="ml-1 inline-flex h-5 w-5 items-center justify-center align-middle text-foreground-muted" aria-expanded={open} aria-label={open ? "Collapse about" : "Expand about"} onClick={() => setOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" className={open ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
          </button>
        )}
      </p>
    </div>
  );
}

function Mark({ src, fallback }: { src?: string | null; fallback: string }) {
  return (
    <span className="brand-mark">
      {src ? <img src={src} alt="" /> : <span>{fallback.slice(0, 1)}</span>}
    </span>
  );
}

function achievementLines(raw: string | null | undefined) {
  return (raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function siteLogo(url: string | null | undefined) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : null;
  } catch {
    return null;
  }
}

type TabId = "about" | "projects" | "writing" | "trading" | "airdrops" | "onchain";

type Props = {
  profileUrl: string;
  longBio: string | null;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  tradingPlatforms: TradingPlatform[];
  credentials: Credential[];
  writings: Writing[];
  trades: Trade[];
  updatesByTrade: Record<string, TradeUpdate[]>;
  community: CommunityItem[];
  airdrops: Airdrop[];
  nfts: Collectible[];
  walletAddress: string | null;
  ensName: string | null;
  arkhamUrl: string | null;
  showWriting: boolean;
  showTrading: boolean;
  showCommunity: boolean;
  showAirdrops: boolean;
  showOnchain: boolean;
  showDustTokens?: boolean;
};

function SectionHead({ num, title, desc }: { num: string; title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <p className="public-section-kicker">{num}</p>
      <h3 className="public-section-title">{title}</h3>
      {desc && <p className="public-section-desc">{desc}</p>}
    </div>
  );
}

export default function PublicProfileTabs({
  profileUrl, longBio, skills, workExperience, education, tradingPlatforms, credentials, writings, trades, updatesByTrade, community, airdrops, nfts, walletAddress, ensName, arkhamUrl, showWriting, showTrading, showCommunity, showAirdrops, showOnchain, showDustTokens = false,
}: Props) {
  const allTabs: { id: TabId; label: string; show: boolean }[] = [
    { id: "about", label: "About", show: true },
    { id: "projects", label: "Projects", show: showCommunity },
    { id: "writing", label: "Writing", show: showWriting },
    { id: "trading", label: "Trading", show: showTrading },
    { id: "onchain", label: "Onchain", show: showOnchain },
    { id: "airdrops", label: "Airdrops", show: showAirdrops },
  ];
  const tabs = allTabs.filter((t) => t.show);
  const [active, setActive] = useState<TabId>("about");
  const [animKey, setAnimKey] = useState(0);
  const [skillPopup, setSkillPopup] = useState<Skill | null>(null);

  useEffect(() => {
    if (!skillPopup) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [skillPopup]);

  function selectTab(id: TabId) {
    if (id === active) return;
    setActive(id);
    setAnimKey((k) => k + 1);
  }

  return (
    <div className="mt-8 sm:mt-10">
      <div className="sticky top-0 z-20 -mx-1 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="flex gap-0 overflow-x-auto scrollbar-none px-1" style={{ WebkitOverflowScrolling: "touch" }} role="tablist">
          {tabs.map((t) => {
            const isActive = active === t.id;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={isActive} onClick={() => selectTab(t.id)} className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"}`}>
                {t.label}
                {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div key={animKey} className="tab-panel-enter pt-6 pb-12">
        {active === "about" && (
          <div className="space-y-10">
            {skills.length > 0 && (
              <div>
                <SectionHead num="01 / SKILLS" title="Skill pillars" desc="Named skills with a short brief. Tap a chip to read the full description." />
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button key={skill.name} type="button" onClick={() => setSkillPopup(skill)} className="inline-flex items-center rounded-full border border-primary/70 bg-transparent px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {longBio && (
              <div>
                <SectionHead num="02 / ABOUT" title="Background" />
                <AboutCopy text={longBio} />
              </div>
            )}
            {workExperience.length > 0 && (
              <div>
                <SectionHead num="03 / EXPERIENCE" title="Work experience" desc="Roles with company links when provided." />
                <div className="space-y-6">
                  {workExperience.map((w) => {
                    const achievements = achievementLines(w.achievements);
                    return (
                      <div key={w.id} className="public-skill-card">
                        <div className="flex items-start gap-3">
                          <Mark src={w.logo_url || siteLogo(w.url)} fallback={w.company} />
                          <div className="min-w-0">
                            {w.url ? <a href={w.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-primary">{w.company}</a> : <span className="font-medium text-sm">{w.company}</span>}
                            <p className="text-xs text-foreground-muted mt-0.5">{w.role} · {w.employment_type === "full-time" ? "Full-time" : "Part-time"}</p>
                            <p className="text-xs text-foreground-subtle mt-0.5">{w.start_date}{w.end_date ? ` → ${w.end_date}` : " → Present"}</p>
                            {w.description && <p className="mt-1.5 text-xs text-foreground-muted leading-relaxed">{w.description}</p>}
                            {achievements.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {achievements.map((line, index) => (
                                  <li key={`${w.id}-ach-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                                    <span className="mt-px shrink-0 text-primary">•</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {education.length > 0 && (
              <div>
                <SectionHead num="04 / EDUCATION" title="Education" />
                <div className="space-y-5">
                  {education.map((e) => (
                    <div key={e.id} className="public-skill-card">
                      <div className="flex items-start gap-3">
                        <Mark src={e.logo_url || siteLogo(e.url)} fallback={e.institution} />
                        <div>
                          {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-primary">{e.institution}</a> : <span className="font-medium text-sm">{e.institution}</span>}
                          <p className="text-xs text-foreground-muted mt-0.5">{[e.degree, e.field_of_study].filter(Boolean).join(" · ")}</p>
                          <p className="text-xs text-foreground-subtle mt-0.5">{[e.country, e.start_year && e.end_year ? `${e.start_year} - ${e.end_year}` : e.start_year || e.end_year].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {credentials.length > 0 && (
              <div>
                <SectionHead num="05 / DOCS" title="Credentials" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {credentials.map((doc) => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                      <CredentialThumb doc={doc} className="h-36 w-full" />
                      <p className="text-xs font-medium text-center line-clamp-2">{doc.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {active === "projects" && (
          <div>
            <SectionHead num="01 / PROJECTS" title="Projects & collaborations" desc="Personal builds, partnerships and community work." />
            {community.length === 0 ? <div className="text-sm text-foreground-subtle">No projects yet.</div> : (
              <div className="tight-cards tight-cards-4">{community.map((c) => <CommunityCard key={c.id} item={c} profileUrl={profileUrl} />)}</div>
            )}
          </div>
        )}

        {active === "writing" && (
          <div>
            <SectionHead num="01 / WRITING" title="Technical writing" desc="Threads, essays and research." />
            {writings.length === 0 ? <div className="text-sm text-foreground-subtle">No writing yet.</div> : (
              <div className="tight-cards tight-cards-3">
                {writings.map((w) => {
                  const imgs = [w.thumbnail_url, w.image_url_2, siteLogo(w.url)].filter((u): u is string => !!u);
                  return (
                    <article key={w.id} className="card flex flex-col overflow-hidden p-0">
                      {imgs.length > 0 && <TradeImageCarousel images={imgs} href={w.url} hideEmpty className="aspect-[16/10] w-full" />}
                      <div className="p-3">
                        <a href={w.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-primary line-clamp-2">{w.title}</a>
                        {w.description && <p className="mt-1 text-xs text-foreground-muted line-clamp-2">{w.description}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {active === "trading" && (
          <div>
            <SectionHead num="01 / TRADING" title="Trading record" desc="Live calls with entries and exits." />
            {tradingPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {tradingPlatforms.map((p) => (
                  <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface pl-1 pr-3 py-1 text-xs font-medium hover:border-primary/40">
                    <PlatformLogo name={p.name} size={16} />
                    {p.name}
                  </a>
                ))}
              </div>
            )}
            {trades.length === 0 ? <div className="text-sm text-foreground-subtle">No trades yet.</div> : (
              <div className="tight-cards tight-cards-3">{trades.map((t) => <TradeCard key={t.id} trade={t} updates={updatesByTrade[t.id] ?? []} profileUrl={profileUrl} />)}</div>
            )}
          </div>
        )}

        {active === "airdrops" && (
          <div>
            <SectionHead num="01 / AIRDROPS" title="Airdrops" desc="Campaigns farmed, qualified or claimed." />
            {airdrops.length === 0 ? <div className="text-sm text-foreground-subtle">No airdrops yet.</div> : (
              <div className="tight-cards tight-cards-3">{airdrops.map((a) => <AirdropCard key={a.id} item={a} profileUrl={profileUrl} />)}</div>
            )}
          </div>
        )}

        {active === "onchain" && (
          <div>
            <SectionHead num="01 / ONCHAIN" title="Onchain footprint" desc="Wallet activity across connected chains." />
            <OnchainSection profileUrl={profileUrl} nfts={nfts} walletAddress={walletAddress} ensName={ensName} arkhamUrl={arkhamUrl} showDustTokens={showDustTokens} />
          </div>
        )}
      </div>

      {skillPopup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm" onClick={() => setSkillPopup(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary">{skillPopup.name}</span>
              <button type="button" className="text-sm" onClick={() => setSkillPopup(null)} aria-label="Close">×</button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">{skillPopup.description?.trim() || "No description added yet."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
