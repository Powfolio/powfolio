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

// ... (rest of the component remains the same until the early return)

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
  // ... existing state and effects ...

  // Only show the empty state if the owner has nothing connected.
  // Public viewers should still see saved onchain data.
  if (!owner && (!address && wallets.length === 0)) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No onchain data available for this profile yet.
      </div>
    );
  }
  if (owner && !address && wallets.length === 0) {
    return (
      <div className="card p-3 sm:p-4 text-sm text-foreground-subtle">
        No wallet connected. Connect a wallet in Profile to aggregate this talent's onchain footprint.
      </div>
    );
  }

  // ... rest of the component unchanged ...
}
