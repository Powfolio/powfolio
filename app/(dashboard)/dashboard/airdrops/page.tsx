import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AirdropManager from "@/components/airdrops/AirdropManager";
import type { Airdrop } from "@/types/database";
import "@/app/profile-identity.css";

export default async function AirdropsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from("airdrops").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
  ]);
  return <AirdropManager userId={user.id} username={profile?.username || ""} initialItems={(items as Airdrop[]) ?? []} />;
}
