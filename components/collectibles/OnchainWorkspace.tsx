"use client";

import { useEffect, useState } from "react";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import OnchainFootprint from "@/components/profile/OnchainFootprint";
import ExtraWallets from "@/components/profile/ExtraWallets";
import WalletAutoScan from "@/components/collectibles/WalletAutoScan";
import CollectibleManager from "@/components/collectibles/CollectibleManager";
import type { Collectible, CustomChain, ExtraWallet } from "@/types/database";
import type { ImportedTokenRef } from "@/lib/onchain";

const TABS = [
  { id: "footprint", short: "Footprint", icon: "M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13 M16 12h5" },
  { id: "wallets", short: "Wallets", icon: "M3 8h18v10H3z M16 13h3" },
  { id: "collectibles", short: "Collectibles", icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9Z" },
];

export default function OnchainWorkspace({
  userId, username, items, walletAddress, extra, ensName, arkhamUrl, showDustTokens, customChains, publicChainIds, importedTokens, lastScanAt,
}: {
  userId: string;
  username: string;
  items: Collectible[];
  walletAddress: string | null;
  extra: ExtraWallet[];
  ensName: string | null;
  arkhamUrl: string | null;
  showDustTokens: boolean;
  customChains: CustomChain[];
  publicChainIds: string[] | null;
  importedTokens: ImportedTokenRef[];
  lastScanAt: string | null;
}) {
  const [tab, setTab] = useState("footprint");
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === hash)) setTab(hash);
  }, []);
  const wallets = [
    ...(walletAddress ? [{ address: walletAddress, label: "Primary" }] : []),
    ...extra.map((w) => ({ address: w.address, label: w.label || w.address.slice(0, 6) })),
  ];

  return (
    <WorkspaceShell title="Onchain" eyebrow="Onchain workspace" intro="Connected wallets, live footprint and collectibles held on those addresses. Wallet connection stays the same as the existing onchain flow." username={username} note="Onchain workspace" tabs={TABS} tab={tab} onTab={setTab}>
      {tab === "footprint" && (
        <div className="block">
          <div className="section-intro"><h2>Footprint</h2><p>Activity from the wallets already connected to this account.</p></div>
          <OnchainFootprint address={walletAddress} ensName={ensName} arkhamUrl={arkhamUrl} owner profileId={userId} showDustTokens={showDustTokens} wallets={wallets} customChains={customChains} publicChainIds={publicChainIds} importedTokens={importedTokens} />
        </div>
      )}
      {tab === "wallets" && (
        <div className="block">
          <div className="section-intro"><h2>Wallets</h2><p>Connect another wallet the same way as the existing onchain page. The primary wallet still comes from profile identity.</p></div>
          <WalletAutoScan lastScanAt={lastScanAt} />
          <ExtraWallets profileId={userId} initial={extra} />
        </div>
      )}
      {tab === "collectibles" && (
        <div className="block">
          <div className="section-intro"><h2>Collectibles</h2><p>Import NFTs from a connected wallet or a contract link. Visibility and order stay on each item.</p></div>
          <CollectibleManager userId={userId} initialItems={items} walletAddress={walletAddress} wallets={wallets} />
        </div>
      )}
    </WorkspaceShell>
  );
}
