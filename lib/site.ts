export const SITE_NAME = "Powfolio";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://pow3folio.vercel.app"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "A public proof-of-work profile for Web3 talent. One link for writing, trading, projects, airdrops, onchain activity, and a downloadable CV.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
