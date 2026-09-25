import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "");
  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "Email/username and password are required." }, { status: 400 });
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    if (!hasServiceRole()) {
      return NextResponse.json(
        { ok: false, error: "Use your account email to sign in." },
        { status: 400 }
      );
    }
    try {
      const admin = createServiceClient();
      const username = identifier.replace(/^@/, "").toLowerCase();
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (!profile?.id) {
        return NextResponse.json({ ok: false, error: "Invalid login credentials." }, { status: 401 });
      }
      const { data: userData, error } = await admin.auth.admin.getUserById(profile.id);
      if (error || !userData.user?.email) {
        return NextResponse.json({ ok: false, error: "Invalid login credentials." }, { status: 401 });
      }
      email = userData.user.email;
    } catch (e) {
      console.error("password-login resolve", e);
      return NextResponse.json({ ok: false, error: "Could not resolve that username." }, { status: 500 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "Auth is not configured." }, { status: 500 });
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Invalid login credentials." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    userId: data.user?.id || null,
  });
}
