/**
 * Normalize `?next=` for post-login redirect: same-origin path only (no open redirects).
 */
export function syndicateNextPathFromSearch(raw: string | string[] | undefined): string {
  const s = (typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined)?.trim() || "";
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  return s;
}
