import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { softDeleteAccount } from "@/lib/accounts/soft-delete";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const body = await req.json().catch(() => null);
    const confirmEmail = typeof body?.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
    const phrase = typeof body?.phrase === "string" ? body.phrase.trim() : "";
    if (phrase.toUpperCase() !== "DELETE") {
      return NextResponse.json({ error: "Confirmation phrase required" }, { status: 400 });
    }
    const loginEmail = (user.email || "").toLowerCase();
    if (!loginEmail || confirmEmail !== loginEmail) {
      return NextResponse.json({ error: "Email confirmation failed" }, { status: 400 });
    }
    await softDeleteAccount({ userId: user.id, reason: "User requested delete" });
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    return NextResponse.json({ ok: true, note: "Account removed from public view. Super Admin keeps a sealed copy for 180 days." });
  } catch (e) {
    console.error("account delete", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
