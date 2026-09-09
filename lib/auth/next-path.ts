export function safeNextPath(raw: string | null | undefined, fallback = "/dashboard") {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return fallback;
  return path.slice(0, 200) || fallback;
}
