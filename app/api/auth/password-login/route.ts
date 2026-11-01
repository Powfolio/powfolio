import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { allowRate } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const LOCKOUT_DURATIONS_MS = [
  15 * 60_000,      // 15 min
  30 * 60_000,      // 30 min
  60 * 60_000,      // 1 hr
  4 * 60 * 60_000,  // 4 hr
  12 * 60 * 60_000, // 12 hr
  24 * 60 * 60_000, // 1 day
  2 * 24 * 60 * 60_000, // 2 days
  7 * 24 * 60 * 60_000, // 7 days (max)
];

async function getLockout(admin: any, idKey: string) {
  const { data } = await admin
    .from("login_lockouts")
    .select("failed_count, locked_until, lockout_level")
    .eq("identifier", idKey)
    .maybeSingle();
  return data;
}

async function setLockout(admin: any, idKey: string, failed: number, level: number, until: number | null) {
  await admin.from("login_lockouts").upsert({
    identifier: idKey,
    failed_count: failed,
    lockout_level: level,
    locked_until: until ? new Date(until).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "identifier" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "");
  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "Email/username and password are required." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const idKey = identifier.toLowerCase().slice(0, 120);

  // Existing IP + identifier rate limits
  if (!(await allowRate(`login-ip:${ip}`, 12, 5 * 60_000)) || !(await allowRate(`login-id:${idKey}`, 8, 10 * 60_000))) {
    return NextResponse.json({ ok: false, error: "Too many sign-in attempts. Try again in about 10 minutes.", retryAfterSeconds: 600, rateLimit: "login" }, { status: 429, headers: { "Retry-After": "600" } });
  }

  let admin: any = null;
  if (hasServiceRole()) {
    admin = createServiceClient();
    const lock = await getLockout(admin, idKey);
    if (lock?.locked_until && new Date(lock.locked_until).getTime() > Date.now()) {
      const remaining = Math.ceil((new Date(lock.locked_until).getTime() - Date.now()) / 1000);
      return NextResponse.json({
        ok: false,
        error: `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(remaining / 60)} minutes.`,
        retryAfterSeconds: remaining,
        locked: true,
      }, { status: 429, headers: { "Retry-After": String(remaining) } });
    }
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
      const username = identifier.replace(/^@/, "").toLowerCase();
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (!profile?.id) {
        // Count as failure for lockout
        if (admin) await recordFailure(admin, idKey);
        return NextResponse.json({ ok: false, error: "Invalid login credentials." }, { status: 401 });
      }
      const { data: userData, error } = await admin.auth.admin.getUserById(profile.id);
      if (error || !userData.user?.email) {
        if (admin) await recordFailure(admin, idKey);
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
    if (admin) await recordFailure(admin, idKey);
    return NextResponse.json(
      { ok: false, error: "Invalid login credentials." },
      { status: 401 }
    );
  }

  // Success: reset lockout
  if (admin) {
    await setLockout(admin, idKey, 0, 0, null);
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

async function recordFailure(admin: any, idKey: string) {
  const current = await getLockout(admin, idKey);
  const failed = (current?.failed_count || 0) + 1;
  let level = current?.lockout_level || 0;
  let until: number | null = null;

  if (failed >= 5) {
    level = Math.min(level + 1, LOCKOUT_DURATIONS_MS.length - 1);
    until = Date.now() + LOCKOUT_DURATIONS_MS[level];
  }

  await setLockout(admin, idKey, failed, level, until);
}
