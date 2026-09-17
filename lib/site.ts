export const SITE_NAME = "Pow3Folio";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://pow3folio.vercel.app"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "A public proof-of-work profile for Web3 builders, traders, researchers, community leads, airdrop hunters, and developers. One clean link for trades, writing, community work, airdrops, credentials, and onchain activity.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
