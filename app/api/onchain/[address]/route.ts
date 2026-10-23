import { NextResponse } from "next/server";
import { type CustomChainInput, type ImportedTokenRef } from "@/lib/onchain";
import { loadOnchainFootprintFast } from "@/lib/onchain-fast";
import { enrichFootprint, normalizeExtraChains } from "@/lib/chain-enrich";
import { allowRate } from "@/lib/security/rate-limit";

export const revalidate = 60;
export const maxDuration = 25;

function parseJson<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const addrKey = address.toLowerCase().slice(0, 42);
  if (!(await allowRate(`onchain-main-ip:${ip}`, 15, 60_000)) || !(await allowRate(`onchain-main-addr:${addrKey}`, 5, 60_000))) {
    return NextResponse.json({ error: "Too many lookups. Try again in about 1 minute.", retryAfterSeconds: 60, rateLimit: "onchain" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const url = new URL(req.url);
  const extra = normalizeExtraChains(parseJson<CustomChainInput>(url.searchParams.get("chains")));
  const imported = parseJson<ImportedTokenRef>(url.searchParams.get("tokens"));

  let data;
  try {
    data = await loadOnchainFootprintFast(address, extra, imported);
  } catch (err) {
    console.error("[onchain] loadOnchainFootprint failed:", err);
    return NextResponse.json({ error: "Onchain lookup failed" }, { status: 502 });
  }

  if (!data) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    await Promise.race([
      enrichFootprint(data, extra, imported),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  } catch (err) {
    console.error("[onchain] enrichFootprint failed:", err);
  }

  return NextResponse.json(data);
}
