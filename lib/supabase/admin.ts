import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Server-only. Never import this from a client component.
 * Bypasses RLS. Use only after an admin or owner identity check.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hasServiceRole() {
  return Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim());
}
