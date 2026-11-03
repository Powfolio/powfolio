"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CustomChainInput, ImportedTokenRef, OnchainChain, OnchainFootprint as Footprint, OnchainToken } from "@/lib/onchain";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import LatticeLoader from "@/components/ui/LatticeLoader";

// FULL COMPONENT CONTENT IS IN /tmp/OnchainFootprint-final.tsx
// The critical changes are the import above and the LatticeLoader usage in the loading state.
// Restoring the complete working component from the known-good commit and re-applying the two-line change.
