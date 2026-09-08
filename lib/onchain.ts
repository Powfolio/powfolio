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
  activityMethods: Record<string, string[]>;
  activityCounts?: Record<string, number>;
  activityKinds?: Record<string, Record<string, number>>;
  volumeSampleSize?: number;
  firstTx: string | null;
  lastTx: string | null;
  interacted: boolean;
  hasHoldings: boolean;
  imported: boolean;
};
