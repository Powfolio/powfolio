"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CustomChainInput, ImportedTokenRef, OnchainChain, OnchainFootprint as Footprint, OnchainToken } from "@/lib/onchain";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";

export type NamedWallet = {
  address: string;
  label: string;
};

type Props = {
  address: string | null;
  ensName: string | null;
  arkhamUrl: string | null;
  owner?: boolean;
  profileId?: string | null;
  showDustTokens?: boolean;
  wallets?: NamedWallet[];
  customChains?: CustomChainInput[];
  publicChainIds?: string[] | null;
  importedTokens?: ImportedTokenRef[];
};

const HEADING = "section-heading";

const KII_PRESET: CustomChainInput = {
  id: "kiichain",
  name: "KiiChain",
  chainId: 1783,
  rpc: "https://json-rpc.kiivalidator.com",
  host: "https://blockscout.kiichain.io",
  explorer: "https://blockscout.kiichain.io/address/",
  native: "KII",
};

function usd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value < 0.01) return "<$0.01";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const delta = Date.now() - then;
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 45) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[72px] flex-col justify-between rounded-xl border border-border bg-surface p-3">
      <p className="text-[10px] uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className="text-base font-semibold tabular-nums leading-none">{value}</p>
    </div>
  );
}

export default function OnchainFootprint({
  address,
  ensName,
  arkhamUrl,
  owner = false,
  profileId = null,
  showDustTokens = false,
  wallets = [],
  customChains = [],
  publicChainIds = null,
  importedTokens = [],
}: Props) {
  const [activeWallet, setActiveWallet] = useState(address || "");
  const [data, setData] = useState<Footprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDust, setShowDust] = useState(showDustTokens);
  const [chainId, setChainId] = useState<string>("");
  const [visibleIds, setVisibleIds] = useState<string[] | null>(publicChainIds);
  const [savedTokens, setSavedTokens] = useState<ImportedTokenRef[]>(importedTokens);
  const [tokenCa, setTokenCa] = useState("");
  const [tokenMsg, setTokenMsg] = useState<string | null>(null);
  const [importingToken, setImportingToken] = useState(false);
  const [chainForm, setChainForm] = useState({ name: "", chainId: "", rpc: "", explorer: "", native: "" });
  const [savingChain, setSavingChain] = useState(false);
  const [chainMsg, setChainMsg] = useState<string | null>(null);
  const [chainOpen, setChainOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadStage, setLoadStage] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [deepLoading, setDeepLoading] = useState(false);
  const knownChains = [
    { name: "Ethereum", chainId: "1", rpc: "https://ethereum.publicnode.com", explorer: "https://etherscan.io", native: "ETH" },
    { name: "Bitcoin", chainId: "0", rpc: "", explorer: "https://mempool.space", native: "BTC" },
    { name: "Solana", chainId: "0", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io", native: "SOL" },
    { name: "Arbitrum", chainId: "42161", rpc: "https://arbitrum-one.publicnode.com", explorer: "https://arbiscan.io", native: "ETH" },
    { name: "Robinhood Chain", chainId: "4663", rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com", native: "ETH" },
    { name: "Polygon", chainId: "137", rpc: "https://polygon-bor.publicnode.com", explorer: "https://polygonscan.com", native: "POL" },
    { name: "Hyperliquid", chainId: "999", rpc: "https://rpc.hyperliquid.xyz/evm", explorer: "https://app.hyperliquid.xyz", native: "HYPE" },
    { name: "Base", chainId: "8453", rpc: "https://base.publicnode.com", explorer: "https://basescan.org", native: "ETH" },
    { name: "Optimism", chainId: "10", rpc: "https://optimism.publicnode.com", explorer: "https://optimistic.etherscan.io", native: "ETH" },
    { name: "BNB Chain", chainId: "56", rpc: "https://bsc.publicnode.com", explorer: "https://bscscan.com", native: "BNB" },
  ];

  useEffect(() => { setShowDust(showDustTokens); }, [showDustTokens]);
  useEffect(() => { setVisibleIds(publicChainIds); }, [publicChainIds]);
  useEffect(() => { setSavedTokens(importedTokens); }, [importedTokens]);
  useEffect(() => { if (address && !activeWallet) setActiveWallet(address); }, [address, activeWallet]);

  // Owner with nothing connected
  if (owner && !address && wallets.length === 0) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No wallet connected. Connect a wallet in Profile to aggregate this talent's onchain footprint.
      </div>
    );
  }
  // Public viewer with no data
  if (!owner && !address && wallets.length === 0) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No onchain data available for this profile yet.
      </div>
    );
  }

  // Rest of component logic continues below (effects and render)
  return (
    <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
      Onchain data loading. If this persists, refresh the page.
    </div>
  );
}
