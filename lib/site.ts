export const SITE_NAME = "Powfolio";

// Use one canonical hostname everywhere. Normalize an apex-domain environment
// value so deployment settings cannot accidentally emit non-www SEO URLs.
const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.powfolio.xyz").replace(/\/$/, "");
const normalizedSiteUrl = configuredSiteUrl.replace(/^https:\/\/powfolio\.xyz(?=\/|$)/i, "https://www.powfolio.xyz");
export const SITE_URL = normalizedSiteUrl;

export const SITE_DESCRIPTION =
  "Powfolio is a proof-of-work portfolio and Web3 identity for professionals. Build a public portfolio, Web3 CV or resume, showcase work, and share one trusted talent profile.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
