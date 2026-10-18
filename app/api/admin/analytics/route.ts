import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supabase = createServiceClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, created_at, updated_at, account_status, location_country")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (profiles || []) as {
    id: string;
    created_at?: string | null;
    updated_at?: string | null;
    account_status?: string | null;
    location_country?: string | null;
  }[];

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

  // Approximate activity from updated_at (login / profile edit / dashboard visit proxy)
  const dau = rows.filter((r) => r.updated_at && now - new Date(r.updated_at).getTime() < 1 * day).length;
  const wau = rows.filter((r) => r.updated_at && now - new Date(r.updated_at).getTime() < 7 * day).length;
  const mau = rows.filter((r) => r.updated_at && now - new Date(r.updated_at).getTime() < 30 * day).length;

  const countries: Record<string, number> = {};
  for (const r of rows) {
    const loc = (r.location_country || "Unknown").trim() || "Unknown";
    countries[loc] = (countries[loc] || 0) + 1;
  }
  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count, share: total ? Math.round((count / total) * 1000) / 10 : 0 }));

  const series = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    total,
    active,
    last7,
    last30,
    dau,
    wau,
    mau,
    byDay: series,
    topCountries,
    snapshot: new Date().toISOString(),
  });
}
