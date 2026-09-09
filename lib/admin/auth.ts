import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export type AdminSession = {
  user: User;
  email: string;
  aal: "aal1" | "aal2";
  mfaEnrolled: boolean;
};

function bootstrapEmails() {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function claimRole(user: User): string | null {
  const app = (user.app_metadata || {}) as Record<string, unknown>;
  const raw = app.role ?? app.user_role;
  return typeof raw === "string" ? raw.toLowerCase() : null;
}

async function ensureAdminRow(user: User) {
  const email = (user.email || "").toLowerCase();
  const admin = createServiceClient();
  const { data } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (data?.user_id) return true;

  const allow = bootstrapEmails();
  if (email && allow.includes(email)) {
    await admin.from("admin_users").upsert({ user_id: user.id, email }, { onConflict: "user_id" });
    try {
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...(user.app_metadata || {}), role: "admin" },
      });
    } catch {
      /* claim write is best-effort; table row is the source of truth */
    }
    return true;
  }
  return false;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const byClaim = claimRole(user) === "admin";
  let allowed = byClaim;
  try {
    allowed = byClaim || (await ensureAdminRow(user));
  } catch {
    allowed = byClaim;
  }
  if (!allowed) return null;

  let aal: "aal1" | "aal2" = "aal1";
  let mfaEnrolled = false;
  try {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === "aal2") aal = "aal2";
    const { data: factors } = await supabase.auth.mfa.listFactors();
    mfaEnrolled = (factors?.totp || []).some((f) => f.status === "verified");
  } catch {
    /* MFA APIs unavailable */
  }

  return {
    user,
    email: user.email || "",
    aal,
    mfaEnrolled,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false as const, status: 401, error: "Admin access required", session: null };
  }
  return { ok: true as const, status: 200, error: null, session };
}

export async function requireAdminMfa() {
  const gate = await requireAdmin();
  if (!gate.ok || !gate.session) return gate;
  if (!gate.session.mfaEnrolled || gate.session.aal !== "aal2") {
    return {
      ok: false as const,
      status: 403,
      error: "Admin 2FA required",
      session: gate.session,
    };
  }
  return gate;
}
