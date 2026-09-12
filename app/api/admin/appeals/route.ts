import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const status = req.nextUrl.searchParams.get("status") || "pending";
  try {
    const admin = createServiceClient();
    let query = admin
      .from("account_appeals")
      .select("id, user_id, username, email, grounds, statement, contact_email, attachments, status, admin_note, created_at, reviewed_at")
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data || [] });
  } catch (e) {
    console.error("appeals list", e);
    return NextResponse.json({ error: "Could not load appeals" }, { status: 500 });
  }
}
