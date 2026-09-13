import { NextRequest, NextResponse } from "next/server";
import { createMonthlySnapshots, flushPendingSnapshots } from "@/lib/snapshots/record";
import { purgeExpiredArchives } from "@/lib/snapshots/purge";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  const token = req.nextUrl.searchParams.get("secret") || "";
  return auth === `Bearer ${secret}` || token === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const flushed = await flushPendingSnapshots();
    const monthly = await createMonthlySnapshots();
    const purged = await purgeExpiredArchives();
    return NextResponse.json({
      ok: true,
      flushed: flushed.length,
      monthly,
      purged: purged.filter((row) => row.ok).length,
    });
  } catch (e) {
    console.error("profile lifecycle cron", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "cron failed" }, { status: 500 });
  }
}
