import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit an appeal." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const grounds = String(body?.grounds || "").trim().slice(0, 80);
  const statement = String(body?.statement || "").trim().slice(0, 4000);
  const contactEmail = String(body?.contactEmail || user.email || "").trim().slice(0, 200);
  if (!grounds || statement.length < 20) {
    return NextResponse.json({ error: "Choose a ground and write at least 20 characters." }, { status: 400 });
  }
  const admin = createServiceClient();
  const { data: profile } = await admin.from("profiles").select("id, username, original_username, account_status, suspended_at").eq("id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.account_status !== "suspended") {
    return NextResponse.json({ error: "Only a suspended account can submit an appeal." }, { status: 400 });
  }
  if (profile.suspended_at) {
    const start = new Date(profile.suspended_at).getTime();
    if (Date.now() - start > 60 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "The 60-day appeal window has closed." }, { status: 400 });
    }
  }
  const { data: existing } = await admin.from("account_appeals").select("id").eq("user_id", user.id).in("status", ["pending", "under_review"]).maybeSingle();
  if (existing) return NextResponse.json({ error: "You already have an appeal waiting for review." }, { status: 400 });
  const { error } = await admin.from("account_appeals").insert({
    user_id: user.id,
    username: profile.original_username || profile.username,
    email: user.email || null,
    grounds,
    statement,
    contact_email: contactEmail || null,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
