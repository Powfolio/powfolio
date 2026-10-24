import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

const buildTimestamp = process.env.SITEMAP_BUILD_TIMESTAMP || new Date().toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(buildTimestamp);
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/features`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/how`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  if (!hasServiceRole()) return pages;
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("profiles")
      .select("username, updated_at")
      .eq("is_public", true)
      .not("username", "is", null)
      .limit(2000);
    for (const row of data || []) {
      const username = String(row.username || "").trim().toLowerCase();
      if (!username) continue;
      const profileLastModified = row.updated_at ? new Date(row.updated_at) : lastModified;
      pages.push({
        url: `${SITE_URL}/${username}`,
        lastModified: Number.isNaN(profileLastModified.getTime()) ? lastModified : profileLastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* static pages still ship if the profile list is unavailable */
  }
  return pages;
}
