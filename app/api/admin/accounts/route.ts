import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdminMfa();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const sort = req.nextUrl.searchParams.get("sort") || "newest";
  const status = req.nextUrl.searchParams.get("status") || "all";

  try {
    const admin = createServiceClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, username, display_name, account_status, created_at, wallet_address");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailById = new Map<string, { email: string | null; createdAt: string }>();
    for (const u of users?.users || []) {
      emailById.set(u.id, { email: u.email || null, createdAt: u.created_at });
    }

    let rows = (profiles || []).map((p) => {
      const auth = emailById.get(p.id);
      return {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        email: auth?.email || null,
        status: p.account_status || "active",
        createdAt: p.created_at || auth?.createdAt || null,
        wallet: p.wallet_address,
      };
    });

    if (q) {
      rows = rows.filter(
        (r) =>
          (r.username || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.displayName || "").toLowerCase().includes(q)
      );
    }
    if (status !== "all") {
      rows = rows.filter((r) => r.status === status);
    }

    rows.sort((a, b) => {
      if (sort === "oldest") return (a.createdAt || "").localeCompare(b.createdAt || "");
      if (sort === "username") return (a.username || "").localeCompare(b.username || "");
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    return NextResponse.json({ rows });
  } catch (e) {
    console.error("admin accounts", e);
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}
