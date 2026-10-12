import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requireAdminMfa();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const form = await req.formData();
  const kind = String(form.get("kind") || "");
  const admin = createServiceClient();

  if (kind === "logo" || kind === "watermark") {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an image first." }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "png";
    const path = `site/${kind}-${Date.now()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from("avatars").upload(path, buf, {
      contentType: file.type || "image/png",
      upsert: true,
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const url = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const patch = kind === "logo"
      ? { logo_url: url }
      : {
          watermark_mode: "image",
          watermark_url: url,
          watermark_x: Number(form.get("x") || 50),
          watermark_y: Number(form.get("y") || 50),
          watermark_rotate: Number(form.get("rotate") || -24),
          watermark_opacity: Number(form.get("opacity") || 0.2),
          watermark_scale: Number(form.get("scale") || 1),
        };
    const { error } = await admin.from("site_branding").upsert({ id: 1, ...patch, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, url });
  }

  if (kind === "watermark-text") {
    const text = String(form.get("text") || "POWFOLIO.XYZ").slice(0, 40);
    const x = Number(form.get("x") || 50);
    const y = Number(form.get("y") || 50);
    const rotate = Number(form.get("rotate") || -24);
    const opacity = Number(form.get("opacity") || 0.2);
    const { error } = await admin.from("site_branding").upsert({
      id: 1,
      watermark_mode: "text",
      watermark_text: text,
      watermark_x: x,
      watermark_y: y,
      watermark_rotate: rotate,
      watermark_opacity: opacity,
      watermark_scale: Number(form.get("scale") || 1),
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "watermark-place") {
    const mode = String(form.get("mode") || "");
    const patch: Record<string, string | number> = {
      watermark_x: Number(form.get("x") || 50),
      watermark_y: Number(form.get("y") || 50),
      watermark_rotate: Number(form.get("rotate") || -24),
      watermark_opacity: Number(form.get("opacity") || 0.2),
      watermark_scale: Number(form.get("scale") || 1),
      updated_at: new Date().toISOString(),
    };
    if (mode === "image" || mode === "text") patch.watermark_mode = mode;
    const { error } = await admin.from("site_branding").update(patch).eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
