import { CHAINS, type CustomChainInput } from "@/lib/onchain";

export function blockscoutHostFor(
  chain: { id?: string; name?: string; explorer?: string; host?: string } | null | undefined,
  extra?: CustomChainInput[] | null
) {
  const id = (chain?.id || "").toLowerCase();
  const name = (chain?.name || "").toLowerCase();
  const extraMatch = (extra || []).find(
    (c) => (c.id || "").toLowerCase() === id || (c.name || "").toLowerCase() === name
  );
  if (extraMatch?.host && /blockscout/i.test(extraMatch.host)) return extraMatch.host.replace(/\/$/, "");
  const known = CHAINS.find((c) => c.id === id || c.name.toLowerCase() === name);
  if (known?.host) return known.host.replace(/\/$/, "");
  if (/kii/.test(name) || id === "kiichain") return "https://blockscout.kiichain.io";
  if (id === "polygon" || /polygon/.test(name)) return "https://polygon.blockscout.com";
  const fromExplorer = (chain?.explorer || "").replace(/\/address\/?.*$/i, "").replace(/\/$/, "");
  if (/blockscout/i.test(fromExplorer)) return fromExplorer;
  const fromHost = (chain?.host || "").replace(/\/$/, "");
  if (/blockscout/i.test(fromHost)) return fromHost;
  return fromHost || "";
}
