import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TradingWorkspace from "@/components/trading/TradingWorkspace";
import type { Trade, TradingPlatform } from "@/types/database";
import "@/app/profile-identity.css";

export default async function TradingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from("trades").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("profiles").select("username, trading_platforms").eq("id", user.id).single(),
  ]);
  return (
    <TradingWorkspace
      userId={user.id}
      username={profile?.username || ""}
      initialItems={(items as Trade[]) ?? []}
      initialPlatforms={(profile?.trading_platforms as TradingPlatform[]) ?? []}
    />
  );
}
