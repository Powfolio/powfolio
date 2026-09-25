import { createBrowserClient } from "@supabase/ssr";

const FIFTEEN_DAYS = 60 * 60 * 24 * 15;

function rememberEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem("pow3folio_remember") !== "0";
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: rememberEnabled()
        ? { maxAge: FIFTEEN_DAYS, path: "/", sameSite: "lax" }
        : { path: "/", sameSite: "lax" },
    }
  );
}
