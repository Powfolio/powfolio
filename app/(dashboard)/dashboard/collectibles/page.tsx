import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnchainWorkspace from "@/components/collectibles/OnchainWorkspace";
import type { Collectible, CustomChain, ExtraWallet, Profile } from "@/types/database";
import type { ImportedTokenRef } from "@/lib/onchain";
import "@/app/profile-identity.css";

export default async function CollectiblesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase.from("collectibles").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  const p = (profile || {}) as Partial<Profile>;
  const extra = (p.extra_wallets || []).filter((w) => w?.address);
  return (
    <OnchainWorkspace
      userId={user.id}
      username={p.username || ""}
      items={(items as Collectible[]) ?? []}
      walletAddress={p.wallet_address || null}
      extra={extra as ExtraWallet[]}
      ensName={p.ens_name || null}
      arkhamUrl={p.wallet_address ? `https://arkm.com/explorer/address/${p.wallet_address}` : null}
      showDustTokens={p.show_dust_tokens === true}
      customChains={(p.custom_chains as CustomChain[]) || []}
      publicChainIds={p.public_chain_ids || null}
      importedTokens={(p.imported_tokens as ImportedTokenRef[]) || []}
      lastScanAt={p.last_wallet_scan_at || null}
    />
  );
}
