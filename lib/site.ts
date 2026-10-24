export const SITE_NAME = "Powfolio";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://powfolio.xyz"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Powfolio is a proof-of-work portfolio and Web3 identity for professionals. Build a public portfolio, Web3 CV or resume, showcase work, and share one trusted talent profile.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
