#!/usr/bin/env node
/**
 * Submit current public sitemap URLs to IndexNow.
 * Run with: npm run indexnow:submit
 */
const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.powfolio.xyz").replace(/\/$/, "");
const SITE_URL = configuredSiteUrl.replace(/^https:\/\/powfolio\.xyz(?=\/|$)/i, "https://www.powfolio.xyz");
const keyResponse = await fetch(new URL("/indexnow-key.txt", SITE_URL));
if (!keyResponse.ok) throw new Error("IndexNow key file unavailable: HTTP " + keyResponse.status);
const KEY = (await keyResponse.text()).trim();

if (!/^[a-zA-Z0-9-]{8,128}$/.test(KEY)) {
  throw new Error("IndexNow key file is invalid at " + SITE_URL + "/indexnow-key.txt");
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

const uniqueUrls = [...new Set(urls)].slice(0, 10000);
if (!uniqueUrls.length) throw new Error("No valid public URLs found in sitemap.xml");

// Fail fast if the live sitemap does not match the canonical host. This avoids
// silently submitting the wrong host's URLs to IndexNow.
const wrongHostCount = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1].replaceAll("&amp;", "&").trim())
  .filter((url) => {
    try {
      return new URL(url).host !== new URL(SITE_URL).host;
    } catch {
      return true;
    }
  }).length;
if (wrongHostCount) {
  throw new Error(`Sitemap contains ${wrongHostCount} URL(s) outside canonical host ${new URL(SITE_URL).host}; fix deployment config before submitting.`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key: KEY,
    keyLocation: new URL("/indexnow-key.txt", SITE_URL).toString(),
    urlList: uniqueUrls,
  }),
});

if (!response.ok) {
  const detail = await response.text().catch(() => "");
  throw new Error("IndexNow submission failed: HTTP " + response.status + (detail ? " — " + detail : ""));
}
console.log("IndexNow accepted " + uniqueUrls.length + " sitemap URLs for " + SITE_URL + ". Submission does not guarantee indexing.");
