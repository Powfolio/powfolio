import { NextRequest, NextResponse } from "next/server";
import { createMonthlySnapshots, flushPendingSnapshots } from "@/lib/snapshots/record";
import { purgeExpiredArchives } from "@/lib/snapshots/purge";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
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
    return NextResponse.json({ error: "cron failed" }, { status: 500 });
  }
}
