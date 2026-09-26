export const DELETED_USERNAME_RE = /_del\d*$/i;

export const RESERVED_USERNAMES = new Set([
  "how",
  "features",
  "faq",
  "login",
  "signup",
  "dashboard",
  "dash",
  "auth",
  "ops",
  "privacy",
  "terms",
  "cookies",
  "api",
  "admin",
  "support",
  "help",
  "about",
  "pricing",
  "blog",
  "docs",
  "status",
  "powfolio",
  "pow3folio",
]);

export function isReservedDeletedUsername(username: string) {
  return DELETED_USERNAME_RE.test((username || "").trim().toLowerCase());
}

export function isReservedUsername(username: string) {
  const handle = (username || "").trim().toLowerCase().replace(/^@/, "");
  return RESERVED_USERNAMES.has(handle) || isReservedDeletedUsername(handle);
}

export function reservedUsernameMessage() {
  return "That username is not acceptable.";
}

export function deletedAdminLabel(original: string | null | undefined, current: string) {
  const base = (original || current || "").replace(DELETED_USERNAME_RE, "");
  return base ? `${base}_del` : current;
}
