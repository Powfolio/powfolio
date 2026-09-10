import { NextRequest, NextResponse } from "next/server";
import { requireAdminMfa } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminMfa();
  if (!gate.ok || !gate.session) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await ctx.params;
  try {
    const admin = createServiceClient();
    const { data: profile, error } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error || !profile) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const { data: authUser } = await admin.auth.admin.getUserById(id);
    const { data: reports } = await admin
      .from("profile_reports")
      .select("id, reasons, note, status, created_at, reporter_id, attachments")
      .eq("reported_id", id)
      .order("created_at", { ascending: false });
    const { data: audit } = await admin
      .from("admin_audit_log")
      .select("id, actor_email, action, reason, created_at")
      .eq("target_user_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        status: profile.account_status || "active",
        createdAt: profile.created_at,
        wallet: profile.wallet_address,
        extraWallets: profile.extra_wallets || [],
        isPublic: profile.is_public,
        xUrl: profile.x_url,
        githubUrl: profile.github_url,
        websiteUrl: profile.website_url,
      },
      email: authUser.user?.email || null,
      emailConfirmed: Boolean(authUser.user?.email_confirmed_at),
      providers: (authUser.user?.app_metadata?.providers as string[]) || [],
      reports: reports || [],
      audit: audit || [],
    });
  } catch (e) {
    console.error("admin account detail", e);
    return NextResponse.json({ error: "Could not load account" }, { status: 500 });
  }
}
