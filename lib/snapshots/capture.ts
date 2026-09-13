import { createServiceClient } from "@/lib/supabase/admin";
import { PROFILE_SECRET_KEYS, type ProfilePayload } from "@/lib/snapshots/types";

function stripSecrets(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out = { ...row };
  for (const key of PROFILE_SECRET_KEYS) delete out[key];
  return out;
}

function collectUrls(value: unknown, into: Set<string>) {
  if (!value) return;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && /(\.(png|jpe?g|webp|gif|pdf|svg)|supabase\.co\/storage)/i.test(value)) {
      into.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, into));
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/url|avatar|banner|image|file|chart|thumbnail|logo/i.test(key)) collectUrls(nested, into);
    }
  }
}

export async function assembleProfileState(userId: string): Promise<ProfilePayload> {
  const admin = createServiceClient();
  const [
    { data: profile },
    { data: writings },
    { data: trades },
    { data: tradeUpdates },
    { data: community },
    { data: airdrops },
    { data: collectibles },
    { data: credentials },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("writings").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    admin.from("trades").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    admin.from("trade_updates").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    admin.from("community_items").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    admin.from("airdrops").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    admin.from("collectibles").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    admin.from("credentials").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
  ]);

  const safeProfile = stripSecrets((profile || null) as Record<string, unknown> | null);
  const media = new Set<string>();
  collectUrls(safeProfile, media);
  collectUrls(writings, media);
  collectUrls(trades, media);
  collectUrls(tradeUpdates, media);
  collectUrls(community, media);
  collectUrls(airdrops, media);
  collectUrls(collectibles, media);
  collectUrls(credentials, media);

  return {
    capturedAt: new Date().toISOString(),
    profile: safeProfile,
    writings: writings || [],
    trades: trades || [],
    tradeUpdates: tradeUpdates || [],
    community: community || [],
    airdrops: airdrops || [],
    collectibles: collectibles || [],
    credentials: credentials || [],
    media: [...media],
  };
}
