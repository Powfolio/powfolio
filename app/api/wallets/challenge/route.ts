import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { WALLET_NONCE_COOKIE } from "@/lib/wallets/nonce";

export const runtime = "nodejs";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const message = [
    "Powfolio wants to verify this wallet to sign you in.",
    "",
    `Nonce: ${nonce}`,
    `Issued at: ${issuedAt}`,
  ].join("\n");

  const res = NextResponse.json({ ok: true, nonce, message });
  res.cookies.set(WALLET_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return res;
}
