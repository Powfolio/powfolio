import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileIdentity from "@/components/profile/ProfileIdentity";
import type { Profile, Credential } from "@/types/database";
import "@/app/profile-identity.css";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !profile) redirect("/dashboard");

  const { data: credentials } = await supabase
    .from("credentials")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const identities = user.identities ?? [];
  const google = identities.find((i) => i.provider === "google");
  const googleEmail = typeof google?.identity_data?.email === "string" ? google.identity_data.email : null;

  return (
    <ProfileIdentity
      profile={profile as Profile}
      email={user.email ?? null}
      credentials={(credentials as Credential[]) ?? []}
      linkedProviders={identities.map((i) => i.provider)}
      googleEmail={googleEmail}
    />
  );
}
