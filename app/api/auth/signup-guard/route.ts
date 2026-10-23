import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { SIGNUP_IP_LIMIT, SIGNUP_IP_WINDOW_MS } from "@/lib/reports/constants";

export const runtime = "nodejs";

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const raw = forwarded.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return raw.slice(0, 64);
}

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipHash = hashIp(ip);
    const admin = createServiceClient();
    const since = new Date(Date.now() - SIGNUP_IP_WINDOW_MS).toISOString();
    const { count } = await admin
      .from("signup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count || 0) >= SIGNUP_IP_LIMIT) {
      return NextResponse.json(
        { ok: false, error: "Too many signups from this network. Try again in about 6 hours.", retryAfterSeconds: 21600, rateLimit: "signup" },
        { status: 429, headers: { "Retry-After": "21600" } }
      );
    }
    await admin.from("signup_attempts").insert({ ip_hash: ipHash });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("signup guard", e);
    return NextResponse.json({ ok: false, error: "Signup protection is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
