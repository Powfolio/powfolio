"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CustomChainInput, ImportedTokenRef, OnchainChain, OnchainFootprint as Footprint, OnchainToken } from "@/lib/onchain";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import LatticeLoader from "@/components/ui/LatticeLoader";

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

  useEffect(() => {
    if (!activeWallet) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLoadStage(1);
    const params = new URLSearchParams();
    if (customChains.length) params.set("chains", JSON.stringify(customChains));
    if (savedTokens.length) params.set("tokens", JSON.stringify(savedTokens));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const stages = [10000, 10000, 10000];
    (async () => {
      for (let stage = 0; stage < stages.length; stage += 1) {
        if (cancelled) return;
        setLoadStage(stage + 1);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), stages[stage]);
        try {
          const res = await fetch(`/api/onchain/${activeWallet}${qs}`, { signal: ctrl.signal });
          if (!res.ok) throw new Error("Could not load onchain data");
          const json = (await res.json()) as Footprint;
          if (cancelled) return;
          setData(json);
          const preferred = [...json.chains]
            .filter((c) => c.txCount > 0 || c.transferCount > 0 || c.imported || Number(c.balance) > 0)
            .sort((a, b) => b.txCount - a.txCount || b.transferCount - a.transferCount)[0];
          if (preferred) setChainId(preferred.id);
          setError(null);
          setLoading(false);
          clearTimeout(timer);
          return;
        } catch {
          clearTimeout(timer);
          if (cancelled) return;
        }
      }
      if (!cancelled) {
        setError("stats-problem");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeWallet, customChains, savedTokens, reloadTick]);

  useEffect(() => {
    if (!activeWallet || !chainId || !data) return;
    const current = data.chains.find((c) => c.id === chainId);
    if (!current) return;
    const counts = current.activityCounts || {};
    const sampled = Object.values(counts).reduce((sum, n) => sum + n, 0);
    if (sampled >= Math.min(current.txCount || 0, 50) && Object.keys(counts).length > 0 && current.txCount <= 50) return;
    let cancelled = false;
    setDeepLoading(true);
    const params = new URLSearchParams({ chain: chainId });
    if (customChains.length) params.set("chains", JSON.stringify(customChains));
    fetch(`/api/onchain/${activeWallet}/deep?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { chain?: OnchainChain };
      })
      .then((json) => {
        if (cancelled || !json?.chain) return;
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            chains: prev.chains.map((c) => {
              if (c.id !== json.chain!.id) return c;
              const next = json.chain!;
              const nextDays = next.activityDays || [];
              const prevDays = c.activityDays || [];
              if (!nextDays.length && prevDays.length && (next.txCount || 0) <= (c.txCount || 0)) {
                return {
                  ...c,
                  activityCounts: { ...(c.activityCounts || {}), ...(next.activityCounts || {}) },
                  activityKinds: { ...(c.activityKinds || {}), ...(next.activityKinds || {}) },
                };
              }
              return {
                ...c,
                activityDays: [...new Set([...prevDays, ...nextDays])].sort(),
                activityCounts: { ...(c.activityCounts || {}), ...(next.activityCounts || {}) },
                activityKinds: { ...(c.activityKinds || {}), ...(next.activityKinds || {}) },
                activityMethods: { ...(c.activityMethods || {}), ...(next.activityMethods || {}) },
                txCount: Math.max(c.txCount || 0, next.txCount || 0),
                uniqueContracts: Math.max(c.uniqueContracts || 0, next.uniqueContracts || 0),
                uniqueTokens: Math.max(c.uniqueTokens || 0, next.uniqueTokens || 0),
                tokenTrades: Math.max(c.tokenTrades || 0, next.tokenTrades || 0),
                transferCount: Math.max(c.transferCount || 0, next.transferCount || 0),
                volumeUsd: Math.max(c.volumeUsd || 0, next.volumeUsd || 0),
                feesUsd: Math.max(c.feesUsd || 0, next.feesUsd || 0),
                balance: Number(c.balance) > 0 ? c.balance : (Number(next.balance) > 0 ? next.balance : c.balance),
                nativeUsd: (c.nativeUsd || 0) > 0 ? c.nativeUsd : ((next.nativeUsd || 0) > 0 ? next.nativeUsd : c.nativeUsd),
                nativeSymbol: c.nativeSymbol || next.nativeSymbol,
              };
            }),
          };
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setDeepLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeWallet, chainId, customChains, data?.address]);

  const interacted = useMemo(
    () => data?.chains.filter((c) => c.txCount > 0 || c.transferCount > 0 || c.imported || Number(c.balance) > 0 || customChains.some((x) => (x.name || "").toLowerCase() === c.name.toLowerCase())) ?? [],
    [data]
  );
  const publicList = useMemo(() => {
    if (!visibleIds || visibleIds.length === 0) return interacted;
    const filtered = interacted.filter((c) => visibleIds.includes(c.id));
    return filtered.length ? filtered : interacted.slice(0, 1);
  }, [interacted, visibleIds]);
  const selected: OnchainChain | null = useMemo(() => {
    if (!data || !chainId) return null;
    return data.chains.find((c) => c.id === chainId) || null;
  }, [data, chainId]);
  useEffect(() => {
    if (!publicList.length) return;
    if (!publicList.some((c) => c.id === chainId)) setChainId(publicList[0].id);
  }, [publicList, chainId]);
  const visibleTokens = useMemo(() => {
    if (!data) return [] as OnchainToken[];
    return data.tokens.filter((t) => {
      if (selected && t.chainId !== selected.id) return false;
      if (selected) return true;
      return !t.isDust || showDust;
    });
  }, [data, selected, showDust]);

  async function persistProfile(patch: Record<string, unknown>, okLabel: string) {
    if (!owner || !profileId) return false;
    setSavingChain(true);
    setChainMsg(null);
    try {
      const prefsKeys = ["public_chain_ids", "imported_tokens"];
      const prefsPatch: Record<string, unknown> = {};
      const otherPatch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patch)) {
        if (prefsKeys.includes(key)) prefsPatch[key] = value;
        else otherPatch[key] = value;
      }
      if (Object.keys(prefsPatch).length) {
        const res = await fetch("/api/profile/onchain-prefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefsPatch),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setSavingChain(false);
          setChainMsg(json.error || "Could not save chain visibility.");
          return false;
        }
      }
      if (Object.keys(otherPatch).length) {
        const supabase = createClient();
        const { error: err } = await supabase.from("profiles").update(otherPatch).eq("id", profileId);
        if (err) {
          setSavingChain(false);
          setChainMsg(err.message);
          return false;
        }
      }
      setSavingChain(false);
      setChainMsg(okLabel);
      return true;
    } catch {
      setSavingChain(false);
      setChainMsg("Could not save. Check your connection and try again.");
      return false;
    }
  }

  async function toggleDust() {
    const next = !showDust;
    setShowDust(next);
    if (!owner || !profileId) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ show_dust_tokens: next }).eq("id", profileId);
  }

  async function togglePublicChain(id: string) {
    if (!owner) return;
    const current = visibleIds && visibleIds.length ? visibleIds : interacted.map((c) => c.id);
    const on = current.includes(id);
    const next = on ? current.filter((x) => x !== id) : [...current, id];
    if (next.length < 1) {
      setChainMsg("At least one chain must stay visible on the public page.");
      return;
    }
    setVisibleIds(next);
    const ok = await persistProfile({ public_chain_ids: next }, on ? `${id} hidden on public page.` : `${id} visible on public page.`);
    if (!ok) setVisibleIds(current);
  }

  async function persistChains(next: CustomChainInput[], okLabel: string) {
    const ok = await persistProfile({ custom_chains: next }, okLabel);
    if (ok) window.location.reload();
  }

  async function saveCustomChain(e: React.FormEvent) {
    e.preventDefault();
    const name = chainForm.name.trim();
    const rpc = chainForm.rpc.trim().replace(/\/$/, "");
    const explorer = chainForm.explorer.trim().replace(/\/$/, "");
    if (!name || !rpc) { setChainMsg("Network name and JSON-RPC URL are required."); return; }
    if (customChains.some((c) => (c.name || "").toLowerCase() === name.toLowerCase() || c.rpc === rpc)) {
      setChainMsg("That network is already imported.");
      return;
    }
    await persistChains(
      [...customChains, { name, rpc, explorer: explorer || undefined, native: chainForm.native.trim() || "ETH", chainId: Number(chainForm.chainId) || undefined }],
      `${name} added. Native ${chainForm.native || "ETH"} will load from RPC.`
    );
  }

  async function importTokenByCa(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWallet || !chainId) { setTokenMsg("Select a chain first."); return; }
    const contract = tokenCa.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(contract)) { setTokenMsg("Paste a valid contract address."); return; }
    if (savedTokens.some((t) => t.chainId === chainId && t.contract === contract)) {
      setTokenMsg("That token is already imported on this chain.");
      return;
    }
    setImportingToken(true);
    setTokenMsg("Checking if this wallet holds it…");
    try {
      const qs = new URLSearchParams({ contract, chain: chainId, chains: JSON.stringify(customChains) });
      const res = await fetch(`/api/onchain/${activeWallet}/lookup?${qs.toString()}`);
      const json = (await res.json()) as { tokens?: Array<{ symbol: string; balance: string; chain: string }> };
      const hit = json.tokens?.[0];
      if (!hit) { setTokenMsg("This wallet does not hold that contract on the selected chain."); setImportingToken(false); return; }
      const next = [...savedTokens, { chainId, contract }];
      const ok = await persistProfile({ imported_tokens: next }, `${hit.symbol} imported (${hit.balance} on ${hit.chain}).`);
      if (ok) { setSavedTokens(next); setTokenCa(""); setTokenMsg(`${hit.symbol} added. ${hit.balance} held on ${hit.chain}.`); }
    } catch { setTokenMsg("Lookup failed."); }
    setImportingToken(false);
  }

  if (owner && !address && wallets.length === 0) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No wallet connected. Connect a wallet in Profile to aggregate this talent's onchain footprint.
      </div>
    );
  }
  if (!owner && !address && wallets.length === 0) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No onchain data available for this profile yet.
      </div>
    );
  }

  const ens = data?.ens || ensName;
  const explorers = data?.explorers ?? [
    { label: "Etherscan", href: `https://etherscan.io/address/${activeWallet}` },
    ...(arkhamUrl ? [{ label: "Arkham", href: arkhamUrl }] : []),
  ];
  const dustCount = (data?.tokens || []).filter((t) => t.isDust && (!selected || t.chainId === selected.id)).length;
  const portfolioValue = selected
    ? (selected.nativeUsd || 0) + (data?.tokens || []).filter((t) => t.chainId === selected.id).reduce((sum, t) => sum + (t.usdValue || 0), 0)
    : data?.totalValueUsd || 0;
  const metrics = selected
    ? [
        { label: "Interactions", value: selected.txCount.toLocaleString() },
        { label: "Last 500 txn volume", value: usd(selected.volumeUsd) },
        { label: "Contracts", value: selected.uniqueContracts.toLocaleString() },
        { label: "Fees", value: usd(selected.feesUsd) },
        { label: "Unique tokens", value: selected.uniqueTokens.toLocaleString() },
        { label: "ERC-20 transfers", value: selected.tokenTrades.toLocaleString() },
        { label: "NFT mints", value: (selected.nftMints ?? 0).toLocaleString() },
        { label: `First txn on ${selected.name}`, value: selected.walletAgeDays ? `${selected.walletAgeDays}d ago` : "—" },
        { label: "Last activity", value: timeAgo(selected.lastTx) },
        { label: "Contracts deployed", value: (selected.contractsDeployed || 0).toLocaleString() },
        { label: "Active days", value: selected.activeDays.toLocaleString() },
        { label: "Active weeks", value: selected.activeWeeks.toLocaleString() },
        { label: "Active months", value: selected.activeMonths.toLocaleString() },
        { label: "Transfers", value: selected.transferCount.toLocaleString() },
      ]
    : [
        { label: "Interactions", value: (data?.totalTx || 0).toLocaleString() },
        { label: "Volume", value: usd(data?.totalVolumeUsd) },
        { label: "Contracts", value: (data?.uniqueContracts || 0).toLocaleString() },
        { label: "Fees", value: usd(data?.totalFeesUsd) },
        { label: "Unique tokens", value: (data?.uniqueTokens || 0).toLocaleString() },
        { label: "ERC-20 transfers", value: (data?.totalTokenTrades || 0).toLocaleString() },
        { label: "NFT mints", value: (data?.totalNftMints || 0).toLocaleString() },
        { label: "First txn", value: data?.walletAgeDays ? `${data.walletAgeDays}d ago` : "—" },
        { label: "Last activity", value: timeAgo(data?.lastTx || null) },
        { label: "Contracts deployed", value: (data?.contractsDeployed || 0).toLocaleString() },
        { label: "Active days", value: (data?.activeDays || 0).toLocaleString() },
        { label: "Active weeks", value: (data?.activeWeeks || 0).toLocaleString() },
        { label: "Active months", value: (data?.activeMonths || 0).toLocaleString() },
        { label: "Transfers", value: (data?.totalTransfers || 0).toLocaleString() },
      ];

  return (
    <div className="space-y-4">
      {loading && (
        <div className="card p-3 text-sm text-foreground-muted">
          <LatticeLoader label="Reading onchain footprint" />
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(95, 20 + loadStage * 25)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-foreground-subtle">{Math.min(95, 20 + loadStage * 25)}%</p>
        </div>
      )}
      {error === "stats-problem" && (
        <div className="card p-3 text-sm text-foreground-muted">
          Stats fetching ran into a problem. <button type="button" className="underline" onClick={() => setReloadTick((n) => n + 1)}>Refresh</button> to try again. If the problem persists, <a href="/contact" className="underline">contact support</a>.
        </div>
      )}
      {!loading && data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {publicList.map((c) => (
              <button key={c.id} type="button" onClick={() => setChainId(c.id)} className={`rounded-full border px-3 py-1 text-xs ${chainId === c.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground-muted"}`}>
                {c.name}
              </button>
            ))}
          </div>
          {selected && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {metrics.map((m) => <Metric key={m.label} label={m.label} value={m.value} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
