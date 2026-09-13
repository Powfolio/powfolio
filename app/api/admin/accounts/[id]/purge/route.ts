import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { purgeDeletedAccount } from "@/lib/snapshots/purge";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "Manual purge";
  try {
    await purgeDeletedAccount({
      userId: id,
      actorId: gate.session.user.id,
      actorEmail: gate.session.email,
      reason,
      force: Boolean(body?.force),
    });
    return NextResponse.json({ ok: true, status: "purged" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Purge failed" }, { status: 400 });
  }
}
