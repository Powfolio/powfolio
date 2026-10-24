#!/usr/bin/env node
/**
 * Submit current public sitemap URLs to IndexNow.
 * Run with: npm run indexnow:submit
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://powfolio.xyz").replace(/\/$/, "");
const KEY = (await fetch(new URL("/indexnow-key.txt", SITE_URL))).ok
  ? (await (await fetch(new URL("/indexnow-key.txt", SITE_URL))).text()).trim()
  : "";

if (!KEY || !/^[a-zA-Z0-9-]{8,128}$/.test(KEY)) {
  throw new Error("IndexNow key file is missing or invalid at " + SITE_URL + "/indexnow-key.txt");
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", SITE_URL));
if (!sitemapResponse.ok) throw new Error("Could not fetch sitemap.xml: HTTP " + sitemapResponse.status);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1].replaceAll("&amp;", "&").trim())
  .filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.host === new URL(SITE_URL).host;
    } catch {
      return false;
    }
  });

if (!urls.length) throw new Error("No valid public URLs found in sitemap.xml");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key: KEY,
    keyLocation: new URL("/indexnow-key.txt", SITE_URL).toString(),
    urlList: [...new Set(urls)].slice(0, 10000),
  }),
});

if (!response.ok) {
  const detail = await response.text().catch(() => "");
  throw new Error("IndexNow submission failed: HTTP " + response.status + (detail ? " — " + detail : ""));
}
console.log("IndexNow accepted " + urls.length + " sitemap URLs for " + SITE_URL + ". This confirms submission, not indexing.");
