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

/** Server-controlled claim only. Never trust user_metadata for privileges. */
function claimRole(user: User): string | null {
  const app = (user.app_metadata || {}) as Record<string, unknown>;
  const raw = app.role ?? app.user_role;
  return typeof raw === "string" ? raw.toLowerCase() : null;
}

async function ensureAdminRow(user: User) {
  const email = (user.email || "").toLowerCase();
  const allow = bootstrapEmails();
  if (email && allow.includes(email)) {
    try {
      const admin = createServiceClient();
      await admin.from("admin_users").upsert({ user_id: user.id, email }, { onConflict: "user_id" });
      try {
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { ...(user.app_metadata || {}), role: "admin" },
        });
      } catch {
        /* claim write is best-effort */
      }
    } catch {
      /* table or service role may be mid-deploy; bootstrap email is enough */
    }
    return true;
  }

  const admin = createServiceClient();
  const { data } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return Boolean(data?.user_id);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const byClaim = claimRole(user) === "admin";
  const byBootstrap = bootstrapEmails().includes((user.email || "").toLowerCase());
  let allowed = byClaim || byBootstrap;
  if (!allowed) {
    try {
      allowed = await ensureAdminRow(user);
    } catch {
      allowed = false;
    }
  } else {
    try {
      await ensureAdminRow(user);
    } catch {
      /* ignore */
    }
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

/** Sensitive admin operations require a completed MFA session (AAL2), not merely enrollment. */
export async function requireAdminMfa() {
  const gate = await requireAdmin();
  if (!gate.ok || !gate.session) return gate;
  if (gate.session.aal !== "aal2") {
    return {
      ok: false as const,
      status: 403,
      error: "Admin 2FA required for this action",
      session: gate.session,
    };
  }
  return gate;
}
