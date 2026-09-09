import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWalletFree } from "@/lib/wallets/unique";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const body = await req.json().catch(() => null);
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    if (!address) {
      return NextResponse.json({ ok: false, error: "Wallet address required" }, { status: 400 });
    }
    const result = await assertWalletFree(address, user?.id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("wallet check", e);
    return NextResponse.json({ ok: false, error: "Could not verify wallet" }, { status: 500 });
  }
}
