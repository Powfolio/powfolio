import {
  type CustomChainInput,
  type ImportedTokenRef,
  type OnchainFootprint,
  getPagedItems,
  getJson,
  isAddress,
  toNumber,
} from "@/lib/onchain";
import { blockscoutHostFor } from "@/lib/blockscout-host";
import { kiiLcds, kiiRpcs, loadBankBalances, loadCosmosTxActivity, nativePriceUsd, rpcCall } from "@/lib/chain-rpc";
import { applyActivity, countNfts, sumNativeFlow } from "@/lib/onchain-fast";
import { classifyTx, mergeActivity, tallyActivity } from "@/lib/onchain-activity";

export function normalizeExtraChains(extra: CustomChainInput[]): CustomChainInput[] {
  return extra.map((c) => {
    const isKii = /kii/i.test(c.name || "") || (c.id || "").toLowerCase() === "kiichain" || Number(c.chainId) === 1783;
    if (!isKii) return c;
    return {
      ...c,
      id: c.id || "kiichain",
      name: c.name || "KiiChain",
      host: "https://blockscout.kiichain.io",
      rpc: c.rpc || kiiRpcs()[0],
      lcd: c.lcd || kiiLcds()[0],
      native: c.native || "KII",
      slug: c.slug || "kiichain",
      chainId: c.chainId || 1783,
      explorer: "https://blockscout.kiichain.io/address/",
    };
  });
}

function explorerHost(chain: { id: string; name: string; explorer: string }, extra: CustomChainInput[]) {
  return blockscoutHostFor(chain, extra);
}

export async function enrichFootprint(
  data: OnchainFootprint,
  extra: CustomChainInput[],
  imported: ImportedTokenRef[]
) {
  await Promise.all(
    data.chains.map(async (chain) => {
      try {
        const isKii = /kii/i.test(chain.name) || chain.id === "kiichain";
        const extraMatch = extra.find(
          (c) =>
            (c.id || "").toLowerCase() === chain.id ||
            (c.name || "").toLowerCase() === chain.name.toLowerCase()
        );
        const host = explorerHost(chain, extra);
        const rpcUrl = extraMatch?.rpc || (isKii ? kiiRpcs()[0] : undefined);
        let qty = Number(chain.balance) || 0;

        const needVolume =
          chain.volumeUsd <= 0 ||
          chain.feesUsd <= 0 ||
          chain.txCount === 0 ||
          !(chain.activityDays && chain.activityDays.length) ||
          !chain.activityCounts ||
          Object.keys(chain.activityCounts).length === 0;
        const needBalance = (qty <= 0 || chain.txCount === 0) && !!rpcUrl && isAddress(data.address);

        const [rate, balancePair, bank, activity, txs] = await Promise.all([
          nativePriceUsd(chain.nativeSymbol),
          needBalance
            ? Promise.all([
                rpcCall(isKii ? kiiRpcs() : rpcUrl!, "eth_getBalance", [data.address, "latest"]),
                rpcCall(isKii ? kiiRpcs() : rpcUrl!, "eth_getTransactionCount", [data.address, "latest"]),
              ])
            : Promise.resolve([null, null] as const),
          isKii ? loadBankBalances(kiiLcds(), data.address, "kii") : Promise.resolve([]),
          isKii ? loadCosmosTxActivity(kiiLcds(), data.address, "kii") : Promise.resolve({
            txCount: 0,
            volumeNative: 0,
            firstTx: null as string | null,
            lastTx: null as string | null,
            days: [] as string[],
          }),
          host && needVolume
            ? getPagedItems<{
                value?: string;
                timestamp?: string;
                to?: { hash?: string } | null;
                from?: { hash?: string } | null;
                fee?: { value?: string };
                method?: string | null;
                created_contract?: { hash?: string } | null;
                transaction_types?: string[] | null;
              }>(`${host}/api/v2/addresses/${data.address}/transactions`, 3)
            : Promise.resolve([]),
        ]);

        const [balanceHex, nonceHex] = balancePair;
        if (typeof balanceHex === "string") {
          try {
            qty = Math.max(qty, toNumber(BigInt(balanceHex).toString(), 18));
          } catch {
            /* ignore */
          }
        }
        if (typeof nonceHex === "string") {
          try {
            chain.txCount = Math.max(chain.txCount, Number(BigInt(nonceHex)));
          } catch {
            /* ignore */
          }
        }

        for (const bal of bank) {
          const denom = (bal.denom || "").toLowerCase();
          const amount = bal.amount || "0";
          if (denom === "akii") qty = Math.max(qty, toNumber(amount, 18));
          else if (denom === "ukii") qty = Math.max(qty, toNumber(amount, 6));
          else if (denom === "kii") qty = Math.max(qty, toNumber(amount, 18));
        }
        if (activity.txCount) {
          chain.txCount = Math.max(chain.txCount, activity.txCount);
          chain.transferCount = Math.max(chain.transferCount, activity.txCount);
          if (activity.firstTx) chain.firstTx = chain.firstTx && chain.firstTx < activity.firstTx ? chain.firstTx : activity.firstTx;
          if (activity.lastTx) chain.lastTx = chain.lastTx && chain.lastTx > activity.lastTx ? chain.lastTx : activity.lastTx;
          applyActivity(chain, activity.days);
          mergeActivity(chain, tallyActivity(activity.days.map((day) => ({ timestamp: day, kind: "Transaction" }))));
          if (rate && activity.volumeNative > 0 && chain.volumeUsd === 0) {
            chain.volumeUsd = activity.volumeNative * rate;
          }
        }

        if (txs.length) {
          chain.txCount = Math.max(chain.txCount, txs.length);
          const flow = sumNativeFlow(txs);
          if (rate && rate > 0) {
            if (chain.volumeUsd <= 0 && flow.volumeNative > 0) chain.volumeUsd = flow.volumeNative * rate;
            if (chain.feesUsd <= 0 && flow.feesNative > 0) chain.feesUsd = flow.feesNative * rate;
          }
          mergeActivity(
            chain,
            tallyActivity(txs.map((tx) => ({ timestamp: tx.timestamp, kind: classifyTx(tx) })))
          );
          const deployed = txs.filter((tx) => (!!tx.created_contract || !tx.to?.hash) && (tx.from?.hash || "").toLowerCase() === data.address).length;
          chain.contractsDeployed = Math.max(chain.contractsDeployed, deployed);
          const contracts = new Set(
            txs.map((tx) => (tx.to?.hash || "").toLowerCase()).filter((h) => h && h !== data.address)
          );
          chain.uniqueContracts = Math.max(chain.uniqueContracts, contracts.size);
        }

        if (host && chain.nftMints === 0) {
          const [nftJson, transfers] = await Promise.all([
            getJson(`${host}/api/v2/addresses/${data.address}/nft`, 2500),
            getPagedItems<{
              timestamp?: string;
              type?: string;
              token?: { type?: string; address_hash?: string };
              from?: { hash?: string } | null;
              to?: { hash?: string } | null;
              token_id?: string;
              total?: { token_id?: string };
            }>(`${host}/api/v2/addresses/${data.address}/token-transfers`, 2),
          ]);
          const nftItems = Array.isArray(nftJson)
            ? nftJson
            : ((nftJson as { items?: unknown[] } | null)?.items || []);
          chain.nftMints = Math.max(chain.nftMints, countNfts(transfers, nftItems as never, data.address));
          applyActivity(
            chain,
            transfers.map((tr) => tr.timestamp || "")
          );
        }

        chain.balance = qty > 0 ? String(qty) : chain.balance;
        if (rate && qty > 0) chain.nativeUsd = qty * rate;
        if (chain.firstTx && !chain.walletAgeDays) {
          chain.walletAgeDays = Math.max(1, Math.round((Date.now() - new Date(chain.firstTx).getTime()) / 86400000));
        }
        applyActivity(chain, chain.activityDays || []);
        chain.hasHoldings = qty > 0 || chain.tokenCount > 0 || chain.nftMints > 0 || data.tokens.some((t) => t.chainId === chain.id);
        chain.interacted = chain.txCount > 0 || chain.transferCount > 0 || chain.hasHoldings || chain.imported;
      } catch {
        // Leave this chain as returned by loadOnchainFootprint; do not fail the whole footprint.
      }
    })
  );

  void imported;
  data.totalValueUsd =
    data.tokens.reduce((sum, t) => sum + (t.usdValue && !t.isDust ? t.usdValue : 0), 0) +
    data.chains.reduce((sum, c) => sum + (c.nativeUsd && c.nativeUsd > 0 ? c.nativeUsd : 0), 0);
  data.totalTx = data.chains.reduce((sum, c) => sum + c.txCount, 0);
  data.totalVolumeUsd = data.chains.reduce((sum, c) => sum + c.volumeUsd, 0);
  data.totalFeesUsd = data.chains.reduce((sum, c) => sum + c.feesUsd, 0);
  data.activeChains = data.chains.filter((c) => c.interacted).length;
  data.holdingChains = data.chains.filter((c) => c.hasHoldings).length;
}
