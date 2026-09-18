import {
  type CustomChainInput,
  type OnchainChain,
  mergeChains,
  getPagedItems,
  getJson,
  toNumber,
} from "@/lib/onchain";
import { blockscoutHostFor } from "@/lib/blockscout-host";
import { nativePriceUsd } from "@/lib/chain-rpc";
import { normalizeExtraChains } from "@/lib/chain-enrich";
import { applyActivity, countNfts, sumNativeFlow } from "@/lib/onchain-fast";
import { classifyTransfer, classifyTx, mergeActivity, tallyActivity } from "@/lib/onchain-activity";

const DEEP_PAGES = 10;

type TxItem = {
  value?: string;
  fee?: { value?: string };
  timestamp?: string;
  to?: { hash?: string } | null;
  from?: { hash?: string } | null;
  method?: string | null;
  created_contract?: { hash?: string } | null;
  transaction_types?: string[] | null;
};

type TransferItem = {
  total?: { value?: string; token_id?: string };
  timestamp?: string;
  type?: string;
  token?: { decimals?: string; exchange_rate?: string | number | null; address_hash?: string; symbol?: string; type?: string };
  from?: { hash?: string } | null;
  to?: { hash?: string } | null;
  token_id?: string;
};

type NftItem = {
  id?: string;
  token_type?: string;
  token?: { address_hash?: string; type?: string };
};

function hostFor(chain: OnchainChain, extra: CustomChainInput[]) {
  const merged = mergeChains(normalizeExtraChains(extra));
  const match = merged.find((c) => c.id === chain.id || c.name.toLowerCase() === chain.name.toLowerCase());
  return blockscoutHostFor({ ...chain, host: match?.host }, extra);
}

export async function loadChainDeep(
  address: string,
  chain: OnchainChain,
  extra: CustomChainInput[] = []
): Promise<OnchainChain> {
  const host = hostFor(chain, extra);
  const next: OnchainChain = {
    ...chain,
    activityCounts: { ...(chain.activityCounts || {}) },
    activityKinds: { ...(chain.activityKinds || {}) },
    activityMethods: { ...(chain.activityMethods || {}) },
    activityDays: [...(chain.activityDays || [])],
  } as OnchainChain;

  if (!host) return next;

  const [rate, txs, transfers, nftJson] = await Promise.all([
    nativePriceUsd(next.nativeSymbol),
    getPagedItems<TxItem>(`${host}/api/v2/addresses/${address}/transactions`, DEEP_PAGES),
    getPagedItems<TransferItem>(`${host}/api/v2/addresses/${address}/token-transfers`, 4),
    getJson(`${host}/api/v2/addresses/${address}/nft`, 4000),
  ]);

  const nftItems = (Array.isArray(nftJson) ? nftJson : ((nftJson as { items?: NftItem[] } | null)?.items || [])) as NftItem[];

  if (txs.length) {
    const flow = sumNativeFlow(txs);
    if (rate && rate > 0) {
      next.volumeUsd = flow.volumeNative * rate;
      next.feesUsd = flow.feesNative * rate;
    } else {
      next.volumeUsd = 0;
      next.feesUsd = 0;
    }
    next.volumeSampleSize = txs.length;
    next.txCount = Math.max(next.txCount, txs.length);
    next.contractsDeployed = Math.max(
      next.contractsDeployed,
      txs.filter((tx) => !!tx.created_contract || !tx.to?.hash).length
    );
    next.uniqueContracts = Math.max(
      next.uniqueContracts,
      new Set(txs.map((tx) => (tx.to?.hash || tx.created_contract?.hash || "").toLowerCase()).filter((h) => h && h !== address)).size
    );
  }

  if (transfers.length) {
    next.transferCount = Math.max(next.transferCount, transfers.length);
    let extraVolume = 0;
    for (const tr of transfers) {
      const decimals = Number(tr.token?.decimals || 18);
      const qty = toNumber(tr.total?.value || "0", decimals);
      const tokenRate = tr.token?.exchange_rate == null ? null : Number(tr.token.exchange_rate);
      if (tokenRate != null && Number.isFinite(tokenRate) && tokenRate > 0) extraVolume += qty * tokenRate;
    }
    next.volumeUsd += extraVolume;
    next.tokenTrades = Math.max(
      next.tokenTrades,
      transfers.filter((tr) => {
        const type = (tr.token?.type || tr.type || "").toUpperCase();
        return type.includes("ERC-20") || type === "TOKEN_TRANSFER" || (!type && !/(721|1155|NFT)/.test(type));
      }).length
    );
  }

  next.nftMints = Math.max(next.nftMints || 0, countNfts(transfers, nftItems, address));

  const talliedTxs = tallyActivity(txs.map((tx) => ({ timestamp: tx.timestamp, kind: classifyTx(tx) })));
  const talliedTransfers = tallyActivity(transfers.map((tr) => ({ timestamp: tr.timestamp, kind: classifyTransfer(tr) })));
  mergeActivity(next, talliedTxs);
  for (const [day, kindMap] of Object.entries(talliedTransfers.kinds)) {
    if (!next.activityKinds) next.activityKinds = {};
    if (!next.activityKinds[day]) next.activityKinds[day] = {};
    for (const [kind, n] of Object.entries(kindMap)) {
      next.activityKinds[day][kind] = Math.max(next.activityKinds[day][kind] || 0, n);
    }
  }
  for (const [day, labels] of Object.entries(talliedTransfers.methods)) {
    if (!next.activityMethods) next.activityMethods = {};
    next.activityMethods[day] = [...new Set([...(next.activityMethods[day] || []), ...labels])];
  }
  applyActivity(next, [...talliedTxs.stamps, ...talliedTransfers.stamps]);

  next.interacted = next.txCount > 0 || next.transferCount > 0 || next.hasHoldings || next.imported;
  return next;
}
