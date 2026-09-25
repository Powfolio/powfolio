import { NextRequest, NextResponse } from "next/server";
import { buildVerifiedCookie, otpCookieName, verifyOtpCookie } from "@/lib/auth/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  if (!email || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Enter the 4-digit code from your email." }, { status: 400 });
  }
  const result = verifyOtpCookie(req.cookies.get(otpCookieName())?.value, email, code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
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
  return res;
}
