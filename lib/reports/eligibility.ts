import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";
import { DAILY_REPORT_CAP, MIN_ACCOUNT_AGE_MS, PER_TARGET_COOLDOWN_MS } from "@/lib/reports/constants";

export type Eligibility = {
  ok: boolean;
  reason: string | null;
};

function isVerified(user: User) {
  if (user.email_confirmed_at) return true;
  const providers = (user.app_metadata?.providers as string[] | undefined) || [];
  const identities = user.identities || [];
  const names = new Set(
    [...providers, ...identities.map((i) => i.provider)].map((p) => String(p).toLowerCase())
  );
  return names.has("google") || names.has("github") || names.has("twitter") || names.has("x");
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function checkReportEligibility(user: User, targetUserId: string): Promise<Eligibility> {
  if (user.id === targetUserId) {
    return { ok: false, reason: "You cannot report your own profile." };
  }
  if (!isVerified(user)) {
    return {
      ok: false,
      reason: "Confirm your email, or sign in with Google, GitHub, or X before reporting.",
    };
  }
  const created = user.created_at ? new Date(user.created_at).getTime() : 0;
  if (!created || Date.now() - created < MIN_ACCOUNT_AGE_MS) {
    return { ok: false, reason: "Your account needs to be at least 1 hour old to submit a report." };
  }

  const admin = createServiceClient();
  const { data: reporter } = await admin
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();
  const status = (reporter?.account_status || "active") as string;
  if (status === "suspended" || status === "under_review") {
    return { ok: false, reason: "Your account cannot submit reports while it is suspended or under review." };
  }

  const { data: target } = await admin.from("profiles").select("id, account_status").eq("id", targetUserId).maybeSingle();
  if (!target) return { ok: false, reason: "That profile could not be found." };

  const sinceDay = startOfUtcDay();
  const { count: dayCount } = await admin
    .from("profile_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", sinceDay);
  if ((dayCount || 0) >= DAILY_REPORT_CAP) {
    return { ok: false, reason: "You can submit 1 report per day. Try again after 00:00 UTC." };
  }

  const sinceTarget = new Date(Date.now() - PER_TARGET_COOLDOWN_MS).toISOString();
  const { count: targetCount } = await admin
    .from("profile_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .eq("reported_id", targetUserId)
    .gte("created_at", sinceTarget);
  if ((targetCount || 0) > 0) {
    return { ok: false, reason: "You already reported this profile in the last 24 hours." };
  }

  return { ok: true, reason: null };
}
