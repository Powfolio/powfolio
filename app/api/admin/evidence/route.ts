import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdminMfa();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const path = req.nextUrl.searchParams.get("path") || "";
  if (!path || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const admin = createServiceClient();
    const { data, error } = await admin.storage.from("report-evidence").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ url: data.signedUrl });
  } catch (e) {
    console.error("evidence", e);
    return NextResponse.json({ error: "Could not open file" }, { status: 500 });
  }
}
