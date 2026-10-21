import { NextResponse } from "next/server";
import { lookupWalletToken, type CustomChainInput } from "@/lib/onchain";
import { lookupWalletNfts } from "@/lib/nfts";
import { allowRate } from "@/lib/security/rate-limit";

export const revalidate = 60;
export const maxDuration = 30;

export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const addrKey = address.toLowerCase().slice(0, 42);
  if (!(await allowRate(`onchain-ip:${ip}`, 20, 60_000)) || !(await allowRate(`onchain-addr:${addrKey}`, 6, 60_000))) {
    return NextResponse.json({ error: "Too many lookups. Try again in a minute." }, { status: 429 });
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
  const [tokens, nfts] = await Promise.all([
    lookupWalletToken(address, contract, { chainId: chain || null, extraChains: extra }),
    lookupWalletNfts(address, contract, tokenId || null),
  ]);
  return NextResponse.json({ tokens, nfts });
}
