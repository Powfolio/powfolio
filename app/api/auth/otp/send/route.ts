import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { otpEmail, sendTransactionalEmail } from "@/lib/admin/mail";
import { buildOtpCookie, generateOtpCode, otpCookieName } from "@/lib/auth/otp";

export const runtime = "nodejs";

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const raw = forwarded.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return raw.slice(0, 64);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || email.length > 160) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    const lastSent = req.cookies.get("pow3folio_otp_sent")?.value;
    if (lastSent && Date.now() - Number(lastSent) < 30_000) {
      const wait = Math.ceil((30_000 - (Date.now() - Number(lastSent))) / 1000);
      return NextResponse.json(
        { ok: false, error: `Please wait ${wait}s before requesting another code.`, retryAfterSeconds: wait, rateLimit: "otp-resend" },
        { status: 429, headers: { "Retry-After": String(wait) } }
      );
    }

    if (hasServiceRole()) {
      try {
        const admin = createServiceClient();
        const ipHash = createHash("sha256").update(clientIp(req)).digest("hex");
        const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count } = await admin
          .from("signup_attempts")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", since);
        if ((count || 0) >= 12) {
          return NextResponse.json(
            { ok: false, error: "Too many verification requests. Try again in about 15 minutes.", retryAfterSeconds: 900, rateLimit: "otp-send" },
            { status: 429, headers: { "Retry-After": "900" } }
          );
        }
        await admin.from("signup_attempts").insert({ ip_hash: ipHash });
      } catch {
        /* rate-limit table is best-effort */
      }
    }

    const code = generateOtpCode();
    const cookie = buildOtpCookie(email, code);
    const template = otpEmail({ code });
    const mailed = await sendTransactionalEmail({
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (mailed.skipped) {
      return NextResponse.json(
        { ok: false, error: "Email delivery is not configured. Contact support." },
        { status: 503 }
      );
    }
    if ("ok" in mailed && mailed.ok === false) {
      return NextResponse.json(
        { ok: false, error: "Could not send the verification email. Try again shortly." },
        { status: 502 }
      );
    }

    const res = NextResponse.json({ ok: true, cooldown: cookie.resendSec });
    res.cookies.set(otpCookieName(), cookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: cookie.maxAge,
    });
    res.cookies.set("pow3folio_otp_sent", String(Date.now()), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30,
    });
    return res;
  } catch (e) {
    console.error("otp send", e);
    return NextResponse.json({ ok: false, error: "Could not send verification code." }, { status: 500 });
  }
}
