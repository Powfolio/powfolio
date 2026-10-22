import { NextRequest, NextResponse } from "next/server";
import { buildVerifiedCookie, otpCookieName, verifyOtpCookie } from "@/lib/auth/otp";
import { allowRate } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const ATTEMPT_COOKIE = "pow3folio_otp_attempts";
const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  if (!email || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Enter the 4-digit code from your email." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const emailKey = `otp-email:${email}`;
  const ipKey = `otp-ip:${ip}`;
  if (!(await allowRate(emailKey, MAX_ATTEMPTS, 10 * 60_000)) || !(await allowRate(ipKey, 20, 10 * 60_000))) {
    const res = NextResponse.json({ ok: false, error: "Too many verification attempts. Request a new code or try again in about 10 minutes.", retryAfterSeconds: 600, rateLimit: "otp-verify" }, { status: 429, headers: { "Retry-After": "600" } });
    res.cookies.set(otpCookieName(), "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    return res;
  }

  const result = verifyOtpCookie(req.cookies.get(otpCookieName())?.value, email, code);
  if (!result.ok) {
    const res = NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return res;
  }

  const verified = buildVerifiedCookie(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(verified.name, verified.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: verified.maxAge,
  });
  res.cookies.set(otpCookieName(), "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(ATTEMPT_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
