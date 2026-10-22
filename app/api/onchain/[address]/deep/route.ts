import { NextResponse } from "next/server";
import { type CustomChainInput, type OnchainChain, mergeChains } from "@/lib/onchain";
import { normalizeExtraChains } from "@/lib/chain-enrich";
import { loadChainDeep } from "@/lib/onchain-deep";
import { allowRate } from "@/lib/security/rate-limit";

export const revalidate = 60;
export const maxDuration = 25;

function parseJson<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const addrKey = address.toLowerCase().slice(0, 42);
  if (!(await allowRate(`onchain-deep-ip:${ip}`, 10, 60_000)) || !(await allowRate(`onchain-deep-addr:${addrKey}`, 4, 60_000))) {
    return NextResponse.json({ error: "Too many deep lookups. Try again in a minute." }, { status: 429 });
  }

  const url = new URL(req.url);
  const chainId = (url.searchParams.get("chain") || "").toLowerCase();
  const extra = normalizeExtraChains(parseJson<CustomChainInput>(url.searchParams.get("chains")));
  if (!chainId) {
    return NextResponse.json({ error: "Missing chain" }, { status: 400 });
  }

  const merged = mergeChains(extra);
  const def = merged.find((c) => c.id === chainId || c.name.toLowerCase() === chainId);
  const seed: OnchainChain = {
    id: def?.id || chainId,
    name: def?.name || chainId,
    explorer: `${def?.explorer || ""}${address}`,
    balance: "0",
    nativeSymbol: def?.native || "ETH",
    nativeUsd: null,
    txCount: 0,
    transferCount: 0,
    tokenCount: 0,
    valuedTokenCount: 0,
    volumeUsd: 0,
    feesUsd: 0,
    uniqueContracts: 0,
    uniqueTokens: 0,
    tokenTrades: 0,
    nftMints: 0,
    contractsDeployed: 0,
    walletAgeDays: 0,
    activeDays: 0,
    activeWeeks: 0,
    activeMonths: 0,
    activityDays: [],
    activityMethods: {},
    firstTx: null,
    lastTx: null,
    interacted: !!def?.imported,
    hasHoldings: false,
    imported: !!def?.imported,
  };

  try {
    const chain = await loadChainDeep(address.toLowerCase(), seed, extra);
    return NextResponse.json({ chain });
  } catch (err) {
    console.error("[onchain] deep failed:", err);
    return NextResponse.json({ error: "Deep lookup failed" }, { status: 502 });
  }
}
