export const DELETED_USERNAME_RE = /_del\d*$/i;

export function isReservedDeletedUsername(username: string) {
  return DELETED_USERNAME_RE.test((username || "").trim().toLowerCase());
}

export function reservedUsernameMessage() {
  return "That username is not acceptable.";
}

export function deletedAdminLabel(original: string | null | undefined, current: string) {
  const base = (original || current || "").replace(DELETED_USERNAME_RE, "");
  return base ? `${base}_del` : current;
}
