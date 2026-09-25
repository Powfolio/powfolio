import { NextRequest, NextResponse } from "next/server";
import { isEmailVerifiedCookie } from "@/lib/auth/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const verified = isEmailVerifiedCookie(req.cookies.get("pow3folio_email_verified")?.value, email);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Email verification required." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
