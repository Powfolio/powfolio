import { NextRequest, NextResponse } from "next/server";
import { buildVerifiedCookie, otpCookieName, verifyOtpCookie } from "@/lib/auth/otp";

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

  const attemptsRaw = req.cookies.get(ATTEMPT_COOKIE)?.value || "0";
  const attempts = Number(attemptsRaw);
  if (Number.isFinite(attempts) && attempts >= MAX_ATTEMPTS) {
    const res = NextResponse.json({ ok: false, error: "Too many attempts. Request a new code." }, { status: 429 });
    res.cookies.set(otpCookieName(), "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    return res;
  }

  const result = verifyOtpCookie(req.cookies.get(otpCookieName())?.value, email, code);
  if (!result.ok) {
    const next = (Number.isFinite(attempts) ? attempts : 0) + 1;
    const res = NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    res.cookies.set(ATTEMPT_COOKIE, String(next), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    if (next >= MAX_ATTEMPTS) {
      res.cookies.set(otpCookieName(), "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    }
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
