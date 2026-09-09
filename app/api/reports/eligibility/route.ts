import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReportEligibility } from "@/lib/reports/eligibility";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, login: true, error: "Log in to submit a report." }, { status: 401 });
  }
  const target = req.nextUrl.searchParams.get("target") || "";
  if (!target) {
    return NextResponse.json({ ok: false, error: "Missing target" }, { status: 400 });
  }
  try {
    const result = await checkReportEligibility(user, target);
    return NextResponse.json({ ...result, error: result.reason });
  } catch (e) {
    console.error("eligibility", e);
    return NextResponse.json({ ok: false, error: "Could not check eligibility" }, { status: 500 });
  }
}
