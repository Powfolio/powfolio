import { notFound } from "next/navigation";
import BrandMark from "@/components/ui/BrandMark";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
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
