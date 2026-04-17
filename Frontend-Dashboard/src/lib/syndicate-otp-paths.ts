/**
 * URL prefix for the OTP + Stripe member onboarding UI.
 * Defaults to the root auth routes (`/login`, `/signup`, `/verify-otp`).
 * Set NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE=/syndicate-otp if you want to keep it namespaced.
 */
export function syndicateOtpUiBase(): string {
  return (process.env.NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE || "").replace(/\/$/, "");
}

export function syndicateOtpLoginHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/login?email=${encodeURIComponent(prefillEmail)}` : `${b}/login`;
}

export function syndicateOtpSignupHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/signup?email=${encodeURIComponent(prefillEmail)}` : `${b}/signup`;
}

export function syndicateOtpVerifyHref(email: string, flow: "login" | "signup"): string {
  const b = syndicateOtpUiBase();
  return `${b}/verify-otp?email=${encodeURIComponent(email)}&flow=${flow}`;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isSameAppHost(apiHostname: string, pageHostname: string): boolean {
  if (apiHostname === pageHostname) return true;
  return LOOPBACK_HOSTS.has(apiHostname) && LOOPBACK_HOSTS.has(pageHostname);
}

/**
 * Django returns `POST_LOGIN_REDIRECT_URL` as-is (often `https://localhost:3000/`) while
 * `next dev` is `http://localhost:3000`. A cross-scheme jump drops the session cookie and
 * can load a blank page. When the redirect targets this app on the same host, keep the
 * current origin (scheme + host + port).
 */
export function resolvePostOtpAppRedirect(redirectFromApi: string | undefined): string {
  if (typeof window === "undefined") return "/";
  const origin = window.location.origin;
  const pageHost = window.location.hostname;
  const trimmed = (redirectFromApi ?? "").trim();
  if (!trimmed) return `${origin}/`;
  try {
    const target = new URL(trimmed);
    if (!isSameAppHost(target.hostname, pageHost)) return target.href;
    const path = target.pathname || "/";
    return `${origin}${path}${target.search}${target.hash}`;
  } catch {
    return `${origin}/`;
  }
}
