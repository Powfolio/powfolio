import { notFound } from "next/navigation";
import BrandMark from "@/components/ui/BrandMark";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PUBLIC_PROFILE_COLUMNS } from "@/lib/profile/public-columns";
import type {
  Profile,
  Writing,
  Trade,
  TradeUpdate,
  CommunityItem,
  Airdrop,
  Collectible,
  Credential,
  Skill,
  WorkExperience,
  Education,
  TradingPlatform,
} from "@/types/database";
import type { Metadata } from "next";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ImageLightbox from "@/components/ui/ImageLightbox";
import EmailChip from "@/components/ui/EmailChip";
import PublicProfileTabs from "@/components/profile/PublicProfileTabs";
import PublicProfileCta from "@/components/profile/PublicProfileCta";
import ReportProfileButton from "@/components/report/ReportProfileButton";
import SuspendedOverlay from "@/components/profile/SuspendedOverlay";
import ScoreRings from "@/components/profile/ScoreRings";
import SiteFooter from "@/components/legal/SiteFooter";
import ProfileJsonLd from "@/components/legal/ProfileJsonLd";
import { computeScores } from "@/lib/ai/scores";
import { absoluteUrl as siteUrl, SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ report?: string; appeal?: string }>;
};

type PublicProfileRow = Profile & {
  account_status?: string | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  deleted_at?: string | null;
};

function isProfileRow(value: unknown): value is PublicProfileRow {
  return !!value && typeof value === "object" && "username" in value && typeof (value as { username?: unknown }).username === "string";
}

function normalizeSkills(raw: Profile["skills"]): Skill[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (typeof s === "string") {
        const trimmed = s.trim();
        if (trimmed.startsWith("{") && trimmed.includes("name")) {
          try {
            const parsed = JSON.parse(trimmed) as { name?: string; description?: string };
            if (parsed?.name) {
              return {
                name: String(parsed.name).slice(0, 60),
                description: String(parsed.description || "").slice(0, 250),
              };
            }
          } catch {
            /* fall through */
          }
        }
        return { name: trimmed.slice(0, 60), description: "" };
      }
      if (s && typeof s === "object" && "name" in s) {
        return {
          name: String((s as Skill).name || "").slice(0, 60),
          description: String((s as Skill).description || "").slice(0, 250),
        };
      }
      return { name: "", description: "" };
    })
    .filter((s) => s.name);
}

function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function normalizeWork(list: WorkExperience[] | null | undefined): WorkExperience[] {
  if (!Array.isArray(list)) return [];
  return list.map((w) => ({ ...w, url: absoluteUrl(w.url) }));
}

function normalizeEducation(list: Education[] | null | undefined): Education[] {
  if (!Array.isArray(list)) return [];
  return list.map((e) => ({ ...e, url: absoluteUrl(e.url) }));
}

async function loadProfileRow(username: string): Promise<PublicProfileRow | null> {
  const handle = username.toLowerCase();
  // Public profile reads are server-side only and always use the service-role client.
  // The view exposes an explicit allowlist of public columns; no client fallback is permitted.
  try {
    const admin = createServiceClient();
    const view = await admin.from("profiles_public").select(PUBLIC_PROFILE_COLUMNS).eq("username", handle).maybeSingle();
    if (isProfileRow(view.data)) return view.data;
  } catch {
    /* fall through to the protected base-table read */
  }
  try {
    const admin = createServiceClient();
    const { data } = await admin.from("profiles").select(PUBLIC_PROFILE_COLUMNS).eq("username", handle).maybeSingle();
    if (isProfileRow(data)) return data;
  } catch {
    /* fall through */
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfileRow(username);

  if (!data || data.account_status === "deleted" || data.deleted_at || (!data.is_public && data.account_status !== "suspended")) {
    return { title: "Profile not found", robots: { index: false, follow: false } };
  }
  if (data.account_status === "suspended") {
    return { title: `@${data.username} is suspended`, robots: { index: false, follow: false } };
  }

  const title = data.display_name || `@${data.username}`;
  const description =
    (typeof data.bio === "string" && data.bio.trim()) ||
    `${title} on ${SITE_NAME}. Public proof of work profile.`;
  const urlPath = `/${data.username}`;
  const images = data.avatar_url
    ? [{ url: data.avatar_url, alt: title }]
    : [{ url: "/icon.svg", alt: SITE_NAME }];

  return {
    title,
    description,
    alternates: { canonical: urlPath },
    openGraph: {
      type: "profile",
      url: siteUrl(urlPath),
      siteName: SITE_NAME,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}


function SocialIcon({ label }: { label: string }) {
  const size = 14;
  if (label === "X") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (label === "GitHub") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }
  if (label === "Telegram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const profile = await loadProfileRow(username);

  if (!profile) notFound();

  const p = profile;
  const status = p.account_status || "active";
  if (status === "deleted" || p.deleted_at) notFound();
  if (!p.is_public && status !== "suspended") notFound();
  const suspended = status === "suspended";

  const showWriting = p.show_writing !== false;
  const showTrading = p.show_trading !== false;
  const showCommunity = p.show_community !== false;
  const showAirdrops = p.show_airdrops === true;
  const showOnchain = p.show_nfts !== false;
  const showCredentials = p.show_credentials !== false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === p.id;

  const [
    { data: writings },
    { data: trades },
    { data: community },
    { data: airdrops },
    { data: collectibles },
    { data: credentials },
  ] = await Promise.all([
    showWriting
      ? supabase.from("writings").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    showTrading
      ? supabase.from("trades").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    showCommunity
      ? supabase.from("community_items").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    showAirdrops
      ? supabase.from("airdrops").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    showOnchain
      ? supabase.from("collectibles").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    showCredentials
      ? supabase.from("credentials").select("*").eq("user_id", p.id).eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const writingItems = (writings as Writing[]) ?? [];
  const tradeItems = (trades as Trade[]) ?? [];
  const communityItems = (community as CommunityItem[]) ?? [];
  const airdropItems = (airdrops as Airdrop[]) ?? [];
  const collectibleItems = (collectibles as Collectible[]) ?? [];
  const credentialItems = (credentials as Credential[]) ?? [];

  const tradeIds = tradeItems.map((t) => t.id);
  const updatesByTrade: Record<string, TradeUpdate[]> = {};
  if (tradeIds.length > 0) {
    const { data: updates } = await supabase
      .from("trade_updates")
      .select("*")
      .in("trade_id", tradeIds)
      .order("created_at", { ascending: true });
    for (const u of (updates as TradeUpdate[]) ?? []) {
      if (!updatesByTrade[u.trade_id]) updatesByTrade[u.trade_id] = [];
      updatesByTrade[u.trade_id].push(u);
    }
  }

  const profileUrl = siteUrl(`/${p.username}`);
  const arkhamUrl = p.wallet_address
    ? `https://arkm.com/explorer/address/${p.wallet_address}`
    : null;

  const socials = [
    { label: "X", href: p.x_url },
    { label: "GitHub", href: p.github_url },
    { label: "Telegram", href: p.telegram_url },
    { label: "Website", href: p.website_url },
  ].filter((s) => s.href);

  const publicEmails: string[] = [];
  if (p.show_primary_email && p.primary_email) publicEmails.push(p.primary_email);
  if (p.show_secondary_email && p.secondary_email) publicEmails.push(p.secondary_email);

  const locationLabel =
    p.location_country && p.location_region
      ? `${p.location_region}, ${p.location_country}`
      : p.location_country || p.location_region || null;

  const skillList = normalizeSkills(p.skills);
  const workExp = normalizeWork(p.work_experience as WorkExperience[]);
  const education = normalizeEducation(p.education as Education[]);
  const platforms = (p.trading_platforms as TradingPlatform[]) ?? [];

  const scores = computeScores({
    profile: p,
    writings: writingItems,
    trades: tradeItems,
    community: communityItems,
    airdrops: airdropItems,
    nfts: collectibleItems,
    credentials: credentialItems,
  });

  const hasContacts =
    socials.length > 0 || !!p.wallet_address || !!p.ens_name || publicEmails.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {!suspended && (
        <ProfileJsonLd
          name={p.display_name || p.username}
          username={p.username}
          url={profileUrl}
          description={p.bio}
          image={p.avatar_url}
        />
      )}
      {suspended && (
        <SuspendedOverlay
          username={p.username}
          reason={p.suspension_reason || null}
          suspendedAt={p.suspended_at || null}
          signedIn={!!user}
          isOwner={isOwner}
        />
      )}
      <div className={suspended ? "pointer-events-none select-none blur-sm" : undefined}>
      <header className="border-b border-border/60">
        <div className="container-app flex h-14 items-center justify-between gap-2">
          <BrandMark compact />
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="container-app max-w-5xl py-4 sm:py-5 px-3 sm:px-4">
        <div className="relative animate-fade-in">
          <div className="h-32 sm:h-48 overflow-hidden bg-surface-elevated sm:rounded-xl">
            {p.banner_url ? (
              <ImageLightbox
                src={p.banner_url}
                alt="Profile banner"
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                rounded="xl"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/20 via-surface-elevated to-accent/10" />
            )}
          </div>

          <div className="relative -mt-8 flex items-end justify-between gap-3 px-1 sm:-mt-12 sm:px-2">
            <div className="h-20 w-20 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-full bg-surface-elevated shadow-[0_0_0_3px_#B8863B,0_0_0_6px_var(--background)]">
              {p.avatar_url ? (
                <ImageLightbox
                  src={p.avatar_url}
                  alt={p.display_name || p.username}
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover"
                  rounded="full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-foreground-subtle">
                  {(p.display_name || p.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="score-slot mb-1 mt-14 sm:mt-16 self-end">
              <ScoreRings
                username={p.username}
                initialProfile={scores.profileScore}
                initialBuilder={scores.builderScore}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 px-1 text-left animate-slide-up">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">
                {p.display_name || p.username}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-foreground-muted">@{p.username}</p>
              {p.open_to_work && (
                <span className="badge-open">
                  <span className="badge-open-dot" aria-hidden />
                  Open to opportunities
                </span>
              )}
            </div>
          </div>
        </div>

        {(p.bio || locationLabel) && (
          <div className="mt-2 space-y-1 pl-0.5 animate-slide-up">
            {p.bio && (
              <p className="w-full text-sm text-foreground-muted break-words leading-relaxed">
                {p.bio}
              </p>
            )}
            {locationLabel && (
              <p className="flex items-center gap-1.5 text-xs text-foreground-subtle">
                <span className="location-dot" aria-hidden />
                {locationLabel}
              </p>
            )}
          </div>
        )}

        {hasContacts && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 animate-slide-up">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium transition-all hover:border-primary/40 hover:text-primary"
              >
                <SocialIcon label={s.label} />
                {s.label}
              </a>
            ))}
            {publicEmails.map((em) => (
              <EmailChip key={em} email={em} />
            ))}
            {p.ens_name && (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                {p.ens_name}
              </span>
            )}
            {p.wallet_address && arkhamUrl && (
              <a
                href={arkhamUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Arkham"
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-foreground-subtle transition-all hover:border-primary/40 hover:text-primary"
              >
                {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
              </a>
            )}
          </div>
        )}

        <PublicProfileTabs
          profileUrl={profileUrl}
          longBio={p.long_bio}
          skills={skillList}
          workExperience={workExp}
          education={education}
          tradingPlatforms={platforms}
          credentials={credentialItems}
          writings={writingItems}
          trades={tradeItems}
          updatesByTrade={updatesByTrade}
          community={communityItems}
          airdrops={airdropItems}
          nfts={collectibleItems}
          walletAddress={p.wallet_address}
          ensName={p.ens_name}
          arkhamUrl={arkhamUrl}
          showWriting={showWriting}
          showTrading={showTrading}
          showCommunity={showCommunity}
          showAirdrops={showAirdrops}
          showOnchain={showOnchain}
        />

        {!isOwner && !suspended && (
          <ReportProfileButton
            targetId={p.id}
            targetUsername={p.username}
            signedIn={!!user}
            autoOpen={query?.report === "1"}
          />
        )}
        <PublicProfileCta isOwner={isOwner} />
      </main>
      </div>
      <SiteFooter />
    </div>
  );
}
