import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "viem";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { walletOwner } from "@/lib/wallets/unique";
import { WALLET_NONCE_COOKIE } from "@/lib/wallets/nonce";

export const runtime = "nodejs";

function deny(status: number, error: string) {
  const res = NextResponse.json({ ok: false, error }, { status });
  res.cookies.set(WALLET_NONCE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const address = String(body.address || "").trim().toLowerCase();
    const signature = String(body.signature || "").trim();
    const message = String(body.message || "");
    const nonce = req.cookies.get(WALLET_NONCE_COOKIE)?.value || "";

    if (!address || !signature || !message || !nonce) {
      return deny(400, "Wallet signature is required.");
    }
    if (!message.includes(nonce)) {
      return deny(400, "Wallet challenge expired. Try again.");
    }

    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return deny(401, "Wallet signature did not match.");
    }

    if (!hasServiceRole()) {
      return deny(503, "Wallet login is not configured.");
    }

    const owner = await walletOwner(address);
    if (!owner?.userId) {
      return deny(404, "This wallet is not linked to a Powfolio account. Create an account first, then connect it.");
    }

    const admin = createServiceClient();
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(owner.userId);
    const email = userData.user?.email;
    if (userErr || !email) {
      return deny(400, "This wallet account has no email. Sign in with email, Google, X, or GitHub.");
    }

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const otp = link?.properties?.email_otp;
    if (linkErr || !otp) {
      return deny(500, "Could not start wallet login. Try email sign-in.");
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return deny(500, "Auth is not configured.");
    }

    const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error || !data.session) {
      return deny(401, error?.message || "Wallet login failed.");
    }

    const res = NextResponse.json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      userId: data.user?.id || owner.userId,
    });
    res.cookies.set(WALLET_NONCE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("wallet-login", e);
    return deny(500, "Wallet login failed.");
  }
}
