import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export type SiteBrand = {
  logo_url: string | null;
  mark_url: string | null;
  powbot_url: string | null;
  favicon_url: string | null;
  watermark_mode: "text" | "image";
  watermark_text: string;
  watermark_url: string | null;
  watermark_x: number;
  watermark_y: number;
  watermark_rotate: number;
  watermark_opacity: number;
  watermark_scale: number;
};

const FALLBACK: SiteBrand = {
  logo_url: null,
  mark_url: null,
  powbot_url: null,
  favicon_url: null,
  watermark_mode: "text",
  watermark_text: "POWFOLIO.XYZ",
  watermark_url: null,
  watermark_x: 50,
  watermark_y: 50,
  watermark_rotate: -24,
  watermark_opacity: 0.2,
  watermark_scale: 1,
};

export async function loadSiteBrand(): Promise<SiteBrand> {
  if (!hasServiceRole()) return FALLBACK;
  try {
    const admin = createServiceClient();
    const { data } = await admin.from("site_branding").select("*").eq("id", 1).maybeSingle();
    if (!data) return FALLBACK;
    return {
      logo_url: data.logo_url || null,
      mark_url: data.mark_url || null,
      powbot_url: data.powbot_url || null,
      favicon_url: data.favicon_url || null,
      watermark_mode: data.watermark_mode === "image" ? "image" : "text",
      watermark_text: data.watermark_text || FALLBACK.watermark_text,
      watermark_url: data.watermark_url || null,
      watermark_x: Number(data.watermark_x ?? 50),
      watermark_y: Number(data.watermark_y ?? 50),
      watermark_rotate: Number(data.watermark_rotate ?? -24),
      watermark_opacity: Number(data.watermark_opacity ?? 0.2),
      watermark_scale: Number(data.watermark_scale ?? 1),
    };
  } catch {
    return FALLBACK;
  }
}
