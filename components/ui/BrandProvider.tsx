"use client";

import { createContext, useContext } from "react";

export type BrandSeed = {
  logo_url: string | null;
  powbot_url: string | null;
  favicon_url: string | null;
};

const BrandContext = createContext<BrandSeed>({ logo_url: null, powbot_url: null, favicon_url: null });

export function BrandProvider({ value, children }: { value: BrandSeed; children: React.ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
