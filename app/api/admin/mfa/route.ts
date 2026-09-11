import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type FactorRow = {
  id: string;
  status?: string;
  friendly_name?: string;
  factor_type?: string;
};

function asFactors(raw: unknown): FactorRow[] {
  if (Array.isArray(raw)) return raw as FactorRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as { factors?: FactorRow[]; totp?: FactorRow[]; all?: FactorRow[] };
    return obj.factors || obj.all || obj.totp || [];
  }
  return [];
}

async function listOwnFactors(userId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) throw error;
  return asFactors(data).filter((f) => (f.factor_type || "totp") === "totp");
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    const factors = await listOwnFactors(gate.session.user.id);
    return NextResponse.json({
      factors: factors.map((f) => ({
        id: f.id,
        status: f.status || "unverified",
        friendlyName: f.friendly_name || "Pow3Folio ops",
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not list authenticators" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action === "reset_all" ? "reset_all" : "clear_unverified";
  const userId = gate.session.user.id;

  try {
    const admin = createServiceClient();
    const factors = await listOwnFactors(userId);
    const targets =
      action === "reset_all"
        ? factors
        : factors.filter((f) => (f.status || "unverified") !== "verified");

    const removed: string[] = [];
    for (const factor of targets) {
      const { error } = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
      if (!error) removed.push(factor.id);
    }

    return NextResponse.json({ ok: true, removed: removed.length, action });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not reset authenticator" },
      { status: 500 }
    );
  }
}
