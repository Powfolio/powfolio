import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "viem";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { walletOwner } from "@/lib/wallets/unique";
import { WALLET_NONCE_COOKIE } from "@/lib/wallets/nonce";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const address = String(body.address || "").trim().toLowerCase();
    const signature = String(body.signature || "").trim();
    const message = String(body.message || "");
    const nonce = req.cookies.get(WALLET_NONCE_COOKIE)?.value || "";

    if (!address || !signature || !message || !nonce) {
      return NextResponse.json({ ok: false, error: "Wallet signature is required." }, { status: 400 });
    }
    if (!message.includes(nonce)) {
      return NextResponse.json({ ok: false, error: "Wallet challenge expired. Try again." }, { status: 400 });
    }

    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Wallet signature did not match." }, { status: 401 });
    }

    if (!hasServiceRole()) {
      return NextResponse.json({ ok: false, error: "Wallet login is not configured." }, { status: 503 });
    }

    const owner = await walletOwner(address);
    if (!owner?.userId) {
      return NextResponse.json(
        { ok: false, error: "This wallet is not linked to a Powfolio account. Create an account first, then connect it." },
        { status: 404 },
      );
    }

    const admin = createServiceClient();
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(owner.userId);
    const email = userData.user?.email;
    if (userErr || !email) {
      return NextResponse.json(
        { ok: false, error: "This wallet account has no email. Sign in with email, Google, X, or GitHub." },
        { status: 400 },
      );
    }

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const otp = link?.properties?.email_otp;
    if (linkErr || !otp) {
      return NextResponse.json({ ok: false, error: "Could not start wallet login. Try email sign-in." }, { status: 500 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ ok: false, error: "Auth is not configured." }, { status: 500 });
    }

    const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error || !data.session) {
      return NextResponse.json({ ok: false, error: error?.message || "Wallet login failed." }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: "Wallet login failed." }, { status: 500 });
  }
}
