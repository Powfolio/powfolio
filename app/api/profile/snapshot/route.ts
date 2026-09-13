import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markSnapshotPending } from "@/lib/snapshots/record";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const body = await req.json().catch(() => null);
    const changeType = typeof body?.changeType === "string" ? body.changeType.slice(0, 80) : "profile_updated";
    const changeSection = typeof body?.changeSection === "string" ? body.changeSection.slice(0, 40) : "profile";
    await markSnapshotPending({ userId: user.id, changeType, changeSection });
    return NextResponse.json({ ok: true, queued: true });
  } catch (e) {
    console.error("profile snapshot", e);
    return NextResponse.json({ error: "Could not queue snapshot" }, { status: 500 });
  }
}
