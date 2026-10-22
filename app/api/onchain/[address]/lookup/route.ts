import { NextResponse } from "next/server";
import { lookupWalletToken, type CustomChainInput } from "@/lib/onchain";
import { lookupWalletNfts } from "@/lib/nfts";
import { allowRate } from "@/lib/security/rate-limit";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export const revalidate = 60;
export const maxDuration = 30;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const addrKey = address.toLowerCase().slice(0, 42);
  if (!(await allowRate(`onchain-ip:${ip}`, 20, 60_000)) || !(await allowRate(`onchain-addr:${addrKey}`, 6, 60_000))) {
    return NextResponse.json({ error: "Too many lookups. Try again in about 1 minute.", retryAfterSeconds: 60, rateLimit: "onchain-lookup" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const url = new URL(req.url);
  const contract = url.searchParams.get("contract") || "";
  const tokenId = url.searchParams.get("tokenId") || "";
  const chain = url.searchParams.get("chain") || "";
  let extra: CustomChainInput[] = [];
  try {
    extra = JSON.parse(url.searchParams.get("chains") || "[]") as CustomChainInput[];
    extra = Array.isArray(extra) ? extra.slice(0, 4) : [];
  } catch {
    extra = [];
  }

  // Prefer cached NFT payload when the table exists and the row is fresh.
  if (hasServiceRole() && !contract && !tokenId) {
    try {
      const admin = createServiceClient();
      const { data } = await admin.from("nft_cache").select("payload, updated_at").eq("address", addrKey).maybeSingle();
      const age = data?.updated_at ? Date.now() - new Date(data.updated_at).getTime() : Infinity;
      if (data && Array.isArray(data.payload) && age < CACHE_TTL_MS) {
        const tokens = await lookupWalletToken(address, contract, { chainId: chain || null, extraChains: extra });
        return NextResponse.json({ tokens, nfts: data.payload, cached: true });
      }
    } catch {
      /* table missing or unreadable; fall through to live */
    }
  }

  const [tokens, nfts] = await Promise.all([
    lookupWalletToken(address, contract, { chainId: chain || null, extraChains: extra }),
    lookupWalletNfts(address, contract, tokenId || null),
  ]);

  if (hasServiceRole() && !contract && !tokenId && Array.isArray(nfts)) {
    try {
      const admin = createServiceClient();
      await admin.from("nft_cache").upsert({
        address: addrKey,
        payload: nfts.slice(0, 40),
        updated_at: new Date().toISOString(),
      });
    } catch {
      /* cache write is best-effort */
    }
  }

  return NextResponse.json({ tokens, nfts });
}
