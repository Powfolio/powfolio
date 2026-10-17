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
    .select("id, created_at, updated_at, status")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = profiles || [];
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
  const active = rows.filter((r: { status?: string | null }) => r.status === "active" || !r.status).length;
  const last7 = rows.filter((r: { created_at?: string | null }) => r.created_at && now - new Date(r.created_at).getTime() < 7 * day).length;
  const last30 = rows.filter((r: { created_at?: string | null }) => r.created_at && now - new Date(r.created_at).getTime() < 30 * day).length;

  const countries: Record<string, number> = { Unknown: rows.length };
  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count, share: total ? Math.round((count / total) * 1000) / 10 : 0 }));

  return NextResponse.json({
    total,
    active,
    last7,
    last30,
    byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    topCountries,
  });
}
