import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/how`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];

  if (!hasServiceRole()) return pages;
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("profiles")
      .select("username")
      .eq("is_public", true)
      .not("username", "is", null)
      .limit(2000);
    for (const row of data || []) {
      const username = String(row.username || "").trim().toLowerCase();
      if (!username) continue;
      pages.push({
        url: `${SITE_URL}/${username}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* static pages still ship if the profile list is unavailable */
  }
  return pages;
}
