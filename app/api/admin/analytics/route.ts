import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supabase = createServiceClient();

  const [{ data: profiles, error }, authUsers] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, created_at, account_status, location_country")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (profiles || []) as {
    id: string;
    created_at?: string | null;
    account_status?: string | null;
    location_country?: string | null;
  }[];

  const signInById = new Map<string, string>();
  for (const u of authUsers.data?.users || []) {
    if (u.last_sign_in_at) signInById.set(u.id, u.last_sign_in_at);
  }

  const now = Date.now();
  const day = 86400000;

  const byDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * day);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    if (!r.created_at) continue;
    const key = r.created_at.slice(0, 10);
    if (key in byDay) byDay[key]++;
  }

  const total = rows.length;
  const active = rows.filter((r) => (r.account_status || "active") === "active").length;
  const last7 = rows.filter((r) => r.created_at && now - new Date(r.created_at).getTime() < 7 * day).length;
  const last30 = rows.filter((r) => r.created_at && now - new Date(r.created_at).getTime() < 30 * day).length;

  // Real activity from auth last_sign_in_at, not profile updated_at
  let dau = 0, wau = 0, mau = 0;
  for (const r of rows) {
    const ts = signInById.get(r.id);
    if (!ts) continue;
    const age = now - new Date(ts).getTime();
    if (age < 1 * day) dau++;
    if (age < 7 * day) wau++;
    if (age < 30 * day) mau++;
  }

  const countries: Record<string, number> = {};
  for (const r of rows) {
    const loc = (r.location_country || "Unknown").trim() || "Unknown";
    countries[loc] = (countries[loc] || 0) + 1;
  }
  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count, share: total ? Math.round((count / total) * 1000) / 10 : 0 }));

  return NextResponse.json({
    total,
    active,
    last7,
    last30,
    dau,
    wau,
    mau,
    byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    topCountries,
    snapshot: new Date().toISOString(),
  });
}
