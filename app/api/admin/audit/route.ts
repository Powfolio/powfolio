import { NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAdminMfa();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("admin_audit_log")
      .select("id, actor_email, action, target_username, target_user_id, report_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data || [] });
  } catch (e) {
    console.error("audit list", e);
    return NextResponse.json({ error: "Could not load audit log" }, { status: 500 });
  }
}
