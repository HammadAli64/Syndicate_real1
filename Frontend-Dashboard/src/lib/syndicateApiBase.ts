/**
 * Django mounts REST under /api/. Env may be set to origin only on Railway — normalize so
 * auth and challenges hit /api/auth/..., /api/challenges/...
 */
export function getSyndicateApiBase(): string {
  let u = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "http://127.0.0.1:8000/api").trim();
  u = u.replace(/\/+$/, "");
  if (!u.endsWith("/api")) {
    u = `${u}/api`;
  }
  return u;
}
