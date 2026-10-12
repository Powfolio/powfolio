import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

const memory = new Map<string, { count: number; reset: number }>();

function memoryAllow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || now > bucket.reset) {
    memory.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Shared limit. Uses the database when the service role is configured, otherwise the instance memory. */
export async function allowRate(key: string, limit: number, windowMs = 60_000) {
  if (!hasServiceRole()) return memoryAllow(key, limit, windowMs);
  try {
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_key: key.slice(0, 180),
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (error) return memoryAllow(key, limit, windowMs);
    return data !== false;
  } catch {
    return memoryAllow(key, limit, windowMs);
  }
}
