import "@/app/dashboard-ui.css";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { computeScores } from "@/lib/ai/scores";
import type {
  Profile,
  Writing,
  Trade,
  CommunityItem,
  Airdrop,
  Collectible,
  Credential,
} from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const [
    { data: writings },
    { data: trades },
    { data: community },
    { data: airdrops },
    { data: collectibles },
    { data: credentials },
  ] = await Promise.all([
    supabase.from("writings").select("*").eq("user_id", user.id).eq("is_visible", true),
    supabase.from("trades").select("*").eq("user_id", user.id).eq("is_visible", true),
    supabase.from("community_items").select("*").eq("user_id", user.id).eq("is_visible", true),
    supabase.from("airdrops").select("*").eq("user_id", user.id).eq("is_visible", true),
    supabase.from("collectibles").select("*").eq("user_id", user.id).eq("is_visible", true),
    supabase.from("credentials").select("*").eq("user_id", user.id).eq("is_visible", true),
  ]);

  const p = (profile as Profile | null) ?? null;
  const scores = p
    ? computeScores({
        profile: p,
        writings: (writings as Writing[]) ?? [],
        trades: (trades as Trade[]) ?? [],
        community: (community as CommunityItem[]) ?? [],
        airdrops: (airdrops as Airdrop[]) ?? [],
        nfts: (collectibles as Collectible[]) ?? [],
        credentials: (credentials as Credential[]) ?? [],
      })
    : { profileScore: 0 };

  const flags = {
    show_writing: p?.show_writing !== false,
    show_trading: p?.show_trading !== false,
    show_community: p?.show_community !== false,
    show_airdrops: p?.show_airdrops === true,
    show_nfts: p?.show_nfts !== false,
  };

  const checks = {
    basics: Boolean(p?.display_name && ((p.bio || "").trim().length >= 20 || p.avatar_url)),
    proof: (writings?.length || 0) + (trades?.length || 0) + (community?.length || 0) > 0,
    social: Boolean(p?.x_url || p?.github_url || p?.telegram_url || p?.website_url),
  };

  return (
    <DashboardHome
      userId={user.id}
      email={user.email ?? null}
      username={p?.username ?? null}
      profileScore={scores.profileScore}
      checks={checks}
      flags={flags}
    />
  );
}
