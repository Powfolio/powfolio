import type { OnchainChain } from "@/lib/onchain";
import { applyActivity } from "@/lib/onchain-fast";
import type { DefiProtocol } from "@/lib/defi";

const ZERO = "0x0000000000000000000000000000000000000000";

export type TxLike = {
  method?: string | null;
  to?: { hash?: string } | null;
  from?: { hash?: string } | null;
  created_contract?: { hash?: string } | null;
  transaction_types?: string[] | null;
  value?: string;
};

type TransferLike = {
  type?: string;
  token?: { type?: string };
  from?: { hash?: string } | null;
};

function humanMethod(method: string) {
  const s = method.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  if (!s) return "Transaction";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isContractDeployment(tx: TxLike): boolean {
  const types = (tx.transaction_types || []).map((t) => t.toLowerCase());
  if (tx.created_contract?.hash) return true;
  if (types.includes("contract_creation") || types.includes("contract_created")) return true;
  const to = (tx.to?.hash || "").toLowerCase();
  if (!to || to === ZERO) return true;
  return false;
}

export function protocolForAddress(address: string | null | undefined, protocols: DefiProtocol[] = []) {
  const hash = (address || "").toLowerCase();
  if (!hash) return null;
  return protocols.find((p) => p.address === hash) || null;
}

export function classifyTx(tx: TxLike, protocols: DefiProtocol[] = []): string {
  const types = (tx.transaction_types || []).map((t) => t.toLowerCase());
  const method = (tx.method || "").trim();
  const m = method.toLowerCase();
  if (isContractDeployment(tx)) return "Contract deployment";

  const proto = protocolForAddress(tx.to?.hash, protocols);
  const isSwap = /(swap|exactinput|exactoutput|exact_input|exact_output|multihop|uniswap)/i.test(m);

  if (isSwap) return "Swap";
  if (proto) return `${proto.name} interaction`;
  if (/mint/i.test(m) || types.includes("token_minting")) return "Mint";
  if (/approve/i.test(m)) return "Approval";
  if (/transfer/i.test(m) || types.includes("coin_transfer") || types.includes("token_transfer")) return "Transfer";
  if (types.includes("contract_call") && method) return humanMethod(method);
  if (types.includes("contract_call")) return "Contract call";
  if (Number(tx.value || 0) > 0) return "Transfer";
  return method ? humanMethod(method) : "Transaction";
}

export function classifyTransfer(tr: TransferLike): string {
  const type = `${tr.token?.type || ""} ${tr.type || ""}`.toUpperCase();
  if (type.includes("721") || type.includes("1155") || type.includes("NFT")) {
    const from = (tr.from?.hash || "").toLowerCase();
    if (from === ZERO || /mint/i.test(tr.type || "")) return "NFT mint";
    return "NFT transfer";
  }
  if (/swap/i.test(tr.type || "")) return "Swap";
  return "Transfer";
}

export function tallyActivity(rows: Array<{ timestamp?: string; kind?: string }>) {
  const counts: Record<string, number> = {};
  const kinds: Record<string, Record<string, number>> = {};
  const methods: Record<string, string[]> = {};
  const stamps: string[] = [];
  for (const row of rows) {
    if (!row.timestamp) continue;
    const day = row.timestamp.slice(0, 10);
    stamps.push(row.timestamp);
    counts[day] = (counts[day] || 0) + 1;
    const kind = row.kind || "Transaction";
    if (!kinds[day]) kinds[day] = {};
    kinds[day][kind] = (kinds[day][kind] || 0) + 1;
    if (!methods[day]) methods[day] = [];
    if (!methods[day].includes(kind)) methods[day].push(kind);
  }
  return { counts, kinds, methods, stamps };
}

export function mergeActivity(
  chain: OnchainChain,
  next: { counts: Record<string, number>; kinds: Record<string, Record<string, number>>; methods: Record<string, string[]>; stamps: string[] }
) {
  const bag = chain as OnchainChain & {
    activityCounts?: Record<string, number>;
    activityKinds?: Record<string, Record<string, number>>;
  };
  if (!bag.activityCounts) bag.activityCounts = {};
  if (!bag.activityKinds) bag.activityKinds = {};
  if (!chain.activityMethods) chain.activityMethods = {};
  for (const [day, n] of Object.entries(next.counts)) {
    bag.activityCounts[day] = Math.max(bag.activityCounts[day] || 0, n);
  }
  for (const [day, kindMap] of Object.entries(next.kinds)) {
    if (!bag.activityKinds[day]) bag.activityKinds[day] = {};
    for (const [kind, n] of Object.entries(kindMap)) {
      bag.activityKinds[day][kind] = Math.max(bag.activityKinds[day][kind] || 0, n);
    }
    const kindTotal = Object.values(bag.activityKinds[day]).reduce((sum, v) => sum + v, 0);
    bag.activityCounts[day] = Math.max(bag.activityCounts[day] || 0, kindTotal);
  }
  for (const [day, labels] of Object.entries(next.methods)) {
    const cur = chain.activityMethods[day] || [];
    chain.activityMethods[day] = [...new Set([...cur, ...labels])];
  }
  applyActivity(chain, next.stamps);
}
