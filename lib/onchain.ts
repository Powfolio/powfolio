import { DEFI_BY_CHAIN, type DefiProtocol } from "@/lib/defi";
import {
  bankAsTokens,
  kiiLcds,
  kiiRpcs,
  loadBankBalances,
  loadCosmosTxActivity,
  mapErc20Token,
  nativePriceUsd,
  readErc20,
  rpcCall,
} from "@/lib/chain-rpc";
import { assertPublicHttps } from "@/lib/security/safe-fetch";

export type OnchainChain = {
  id: string;
  name: string;
  explorer: string;
  balance: string;
  nativeSymbol: string;
  nativeUsd: number | null;
  txCount: number;
  transferCount: number;
  tokenCount: number;
  valuedTokenCount: number;
  volumeUsd: number;
  feesUsd: number;
  uniqueContracts: number;
  uniqueTokens: number;
  tokenTrades: number;
  nftMints: number;
  contractsDeployed: number;
  walletAgeDays: number;
  activeDays: number;
  activeWeeks: number;
  activeMonths: number;
  activityDays: string[];
  activityCounts?: Record<string, number>;
  activityKinds?: Record<string, Record<string, number>>;
  activityMethods: Record<string, string[]>;
  volumeSampleSize?: number;
  firstTx: string | null;
  lastTx: string | null;
  interacted: boolean;
  hasHoldings: boolean;
  imported: boolean;
};

export type OnchainToken = {
  symbol: string;
  name: string;
  chain: string;
  chainId: string;
  balance: string;
  contract: string;
  href: string;
  usdValue: number | null;
  isDust: boolean;
};

export type OnchainFootprint = {
  address: string;
  ens: string | null;
  chains: OnchainChain[];
  tokens: OnchainToken[];
  protocols: DefiProtocol[];
  totalTx: number;
  totalTransfers: number;
  activeChains: number;
  holdingChains: number;
  totalVolumeUsd: number;
  totalFeesUsd: number;
  totalValueUsd: number;
  explorers: { label: string; href: string }[];
};

export type CustomChainInput = {
  id?: string;
  name: string;
  host?: string;
  explorer?: string;
  tokenExplorer?: string;
  native?: string;
  slug?: string;
  chainId?: number;
  rpc?: string;
  lcd?: string;
  public?: boolean;
};

export type ImportedTokenRef = {
  chainId: string;
  contract: string;
};

type ChainDef = {
  id: string;
  name: string;
  slug: string;
  host: string;
  explorer: string;
  tokenExplorer: string;
  native: string;
  chainId: number;
  rpc?: string;
  lcd?: string;
  imported?: boolean;
};

export const CHAINS: ChainDef[] = [
  { id: "eth", name: "Ethereum", slug: "ethereum", host: "https://eth.blockscout.com", explorer: "https://etherscan.io/address/", tokenExplorer: "https://etherscan.io/token/", native: "ETH", chainId: 1 },
  { id: "base", name: "Base", slug: "base", host: "https://base.blockscout.com", explorer: "https://basescan.org/address/", tokenExplorer: "https://basescan.org/token/", native: "ETH", chainId: 8453 },
  { id: "arb", name: "Arbitrum", slug: "arbitrum", host: "https://arbitrum.blockscout.com", explorer: "https://arbiscan.io/address/", tokenExplorer: "https://arbiscan.io/token/", native: "ETH", chainId: 42161 },
  { id: "op", name: "Optimism", slug: "optimism", host: "https://optimism.blockscout.com", explorer: "https://optimistic.etherscan.io/address/", tokenExplorer: "https://optimistic.etherscan.io/token/", native: "ETH", chainId: 10 },
  { id: "polygon", name: "Polygon", slug: "polygon", host: "https://polygon.blockscout.com", explorer: "https://polygonscan.com/address/", tokenExplorer: "https://polygonscan.com/token/", native: "POL", chainId: 137 },
  { id: "bsc", name: "BNB Chain", slug: "bsc", host: "https://bsc.blockscout.com", explorer: "https://bscscan.com/address/", tokenExplorer: "https://bscscan.com/token/", native: "BNB", chainId: 56 },
];

export function mergeChains(extra?: CustomChainInput[] | null): ChainDef[] {
  const out: ChainDef[] = [...CHAINS];
  for (const c of extra || []) {
    const name = (c.name || "").trim();
    const rpc = (c.rpc || "").trim().replace(/\/$/, "");
    const host = (c.host || "").trim().replace(/\/$/, "");
    if (!name || (!host && !rpc)) continue;
    const id = (c.id || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
    if (!id || out.some((b) => b.id === id || (host && b.host === host) || (rpc && b.rpc === rpc))) continue;
    const isKii = /kii/i.test(name) || id === "kiichain" || Number(c.chainId) === 1783;
    const resolvedHost = host || (isKii ? "https://explorer.kiichain.io" : "");
    const explorerBase = (c.explorer || resolvedHost || "").replace(/\/$/, "");
    out.push({
      id,
      name,
      slug: (c.slug || id).toLowerCase(),
      host: resolvedHost,
      explorer: explorerBase ? (explorerBase.includes("/address") ? explorerBase.endsWith("/") ? explorerBase : `${explorerBase}/` : `${explorerBase}/address/`) : "",
      tokenExplorer: c.tokenExplorer || (explorerBase ? `${explorerBase}/token/` : ""),
      native: c.native || (isKii ? "KII" : "ETH"),
      chainId: Number(c.chainId || 0),
      rpc: rpc || (isKii ? kiiRpcs()[0] : undefined),
      lcd: c.lcd || (isKii ? kiiLcds()[0] : undefined),
      imported: true,
    });
  }
  return out;
}

export function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function formatUnits(raw: string | number | null | undefined, decimals = 18) {
  if (raw == null) return "0";
  try {
    const n = BigInt(String(raw).split(".")[0] || "0");
    const base = BigInt(10) ** BigInt(decimals);
    const whole = n / base;
    const frac = n % base;
    if (frac === BigInt(0)) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, 6);
    return `${whole}.${fracStr}`;
  } catch {
    return "0";
  }
}

export function toNumber(raw: string | number | null | undefined, decimals = 18) {
  const formatted = formatUnits(raw, decimals);
  const n = Number(formatted);
  return Number.isFinite(n) ? n : 0;
}

export async function getJson(url: string, timeoutMs = 9000): Promise<unknown | null> {
  const safe = await assertPublicHttps(url);
  if (!safe) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(safe, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
    if (!res.ok || (res.status >= 300 && res.status < 400)) return null;
    const len = Number(res.headers.get("content-length") || 0);
    if (len > 2_000_000) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function pageQuery(baseUrl: string, params: Record<string, unknown> | null | undefined) {
  if (!params) return null;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    qs.set(key, String(value));
  }
  const clean = baseUrl.split("?")[0];
  const existing = baseUrl.includes("?") ? baseUrl.slice(baseUrl.indexOf("?") + 1) : "";
  const first = new URLSearchParams(existing);
  for (const [key, value] of qs.entries()) first.set(key, value);
  return `${clean}?${first.toString()}`;
}

export async function getPagedItems<T>(url: string, maxPages = 8): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = url;
  for (let i = 0; i < maxPages && next; i += 1) {
    const json = (await getJson(next)) as { items?: T[]; next_page_params?: Record<string, unknown> } | null;
    out.push(...(json?.items ?? []));
    next = pageQuery(url, json?.next_page_params);
  }
  return out;
}

// The rest of the file continues unchanged. This patch only hardens getJson.
// Downstream callers (loadOnchainFootprint, loadTokenItems, etc.) now inherit the check.
