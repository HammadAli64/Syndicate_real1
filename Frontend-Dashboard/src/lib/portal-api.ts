/** Django portal + auth API client (JWT). */

export const STORAGE_ACCESS = "syndicate_access";
export const STORAGE_REFRESH = "syndicate_refresh";
/** DRF Token from simple email/password login (`/api/syndicate-auth/login/`). */
export const STORAGE_SIMPLE_AUTH = "simple_auth_token";

export type PortalUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  roles: { name: string; display_name: string }[];
  permissions: string[];
};

/**
 * Browser-visible Django origin. Login/signup use `NEXT_PUBLIC_API_BASE_URL`; older code used
 * `NEXT_PUBLIC_API_BASE`. If only one is set, use it for all API calls so you do not mix
 * direct login (→ :8000) with portal-proxy (→ Next → :8000), which breaks when the proxy cannot reach Django.
 */
function publicApiBaseRaw(): string {
  const a = (process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
  if (a) return a;
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
}

/**
 * When unset, empty, or "proxy", the browser calls same-origin `/api/portal-proxy/...`
 * and Next.js forwards to Django. Set `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_API_BASE_URL`
 * to `http://127.0.0.1:8000` for direct browser → Django (matches login pages; needs CORS on Django).
 */
function useNextProxy(): boolean {
  const v = publicApiBaseRaw().toLowerCase();
  return v === "" || v === "proxy";
}

/**
 * Django `APPEND_SLASH` expects `/api/.../resource/?q=` not `/api/.../resource?q=`.
 * Normalizes only the path segment before `?` so query params are never corrupted.
 */
function normalizeDjangoApiPath(apiPath: string): string {
  const raw = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  const qIdx = raw.indexOf("?");
  const pathOnly = qIdx === -1 ? raw : raw.slice(0, qIdx);
  const query = qIdx === -1 ? "" : raw.slice(qIdx + 1);
  const withSlash = pathOnly.endsWith("/") ? pathOnly : `${pathOnly}/`;
  return query ? `${withSlash}?${query}` : withSlash;
}

/** Build fetch URL for an API path like `/api/auth/login/`. */
export function resolveClientApiUrl(apiPath: string): string {
  if (apiPath.startsWith("http://") || apiPath.startsWith("https://")) return apiPath;
  const normalized = normalizeDjangoApiPath(apiPath);
  if (typeof window === "undefined") {
    const base = (publicApiBaseRaw() || "http://127.0.0.1:8000").replace(/\/$/, "");
    return `${base}${normalized}`;
  }
  if (!useNextProxy()) {
    let base = publicApiBaseRaw().replace(/\/$/, "");
    // Misconfiguration: pointing at the Next dev server causes /api/portal/... 404s (no Django there).
    if (
      base &&
      typeof window !== "undefined" &&
      (base.includes(":3000") || base === window.location.origin)
    ) {
      base = "";
    }
    if (!base) {
      const withoutApi = normalized.replace(/^\/api\//, "");
      return `/api/portal-proxy/${withoutApi}`;
    }
    return `${base}${normalized}`;
  }
  const withoutApi = normalized.replace(/^\/api\//, "");
  return `/api/portal-proxy/${withoutApi}`;
}

/** Hint text for login / errors (human-readable). */
export function getApiDisplayHint(): string {
  if (!useNextProxy()) {
    return publicApiBaseRaw().replace(/\/$/, "") || "not configured";
  }
  return (
    "Next.js proxy → Django (BACKEND_INTERNAL_URL or http://127.0.0.1:8000). " +
    'If login works but Programs shows "Failed to fetch", set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 ' +
    "(or NEXT_PUBLIC_API_BASE) so the dashboard calls Django directly, or fix BACKEND_INTERNAL_URL for Docker (e.g. host.docker.internal)."
  );
}

/** @deprecated Use getApiDisplayHint(); kept for older imports. */
export function getApiBase(): string {
  if (typeof window === "undefined") {
    return (publicApiBaseRaw() || "http://127.0.0.1:8000").replace(/\/$/, "");
  }
  if (!useNextProxy()) {
    return publicApiBaseRaw().replace(/\/$/, "");
  }
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Portal JWT login gate for the dashboard. Off unless explicitly enabled (open `/` by default). */
export function authRequired(): boolean {
  const v = (process.env.NEXT_PUBLIC_AUTH_REQUIRED ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function readStoredAccess(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_ACCESS);
}

export function readStoredRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_REFRESH);
}

export function readStoredDrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const t = (window.localStorage.getItem(STORAGE_SIMPLE_AUTH) || "").trim();
  return t || null;
}

/** JWT uses Bearer; DRF authtoken uses Token (see syndicate_backend REST_FRAMEWORK). */
export function getAuthorizationHeader(): string | null {
  const jwt = readStoredAccess();
  if (jwt) return `Bearer ${jwt}`;
  const drf = readStoredDrfToken();
  if (drf) return `Token ${drf}`;
  return null;
}

export function persistTokens(access: string, refresh: string) {
  window.localStorage.setItem(STORAGE_ACCESS, access);
  window.localStorage.setItem(STORAGE_REFRESH, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(STORAGE_ACCESS);
  window.localStorage.removeItem(STORAGE_REFRESH);
}

export function hasPermission(permissions: string[] | undefined, codename: string): boolean {
  if (!permissions?.length) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(codename);
}

export type LoginResponse = {
  access: string;
  refresh: string;
  user: PortalUser;
};

function formatAuthErrorPayload(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.non_field_errors) && d.non_field_errors.length)
      return String(d.non_field_errors[0]);
    if (typeof d.username === "string") return d.username;
    if (Array.isArray(d.username) && d.username.length) return String(d.username[0]);
    if (typeof d.password === "string") return d.password;
    if (Array.isArray(d.password) && d.password.length) return String(d.password[0]);
  }
  if (status === 401) return "No account found or wrong password.";
  return "Login failed.";
}

async function parseJsonOrText(res: Response): Promise<{ json: unknown; raw: string }> {
  const raw = await res.text();
  if (!raw) return { json: {}, raw: "" };
  try {
    return { json: JSON.parse(raw) as unknown, raw };
  } catch {
    return { json: {}, raw };
  }
}

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  const url = resolveClientApiUrl("/api/auth/login/");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
      credentials: "omit"
    });
  } catch {
    throw new Error(
      `Cannot reach API (${getApiDisplayHint()}). Start Next and Django, or set NEXT_PUBLIC_API_BASE to your backend URL.`
    );
  }
  const { json: parsed, raw } = await parseJsonOrText(res);
  const data = parsed as LoginResponse & { detail?: string };
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Login endpoint returned 404. Django has no /api/auth/login/ — save syndicate_backend/urls.py, restart runserver, or set BACKEND_INTERNAL_URL if Django is not on 127.0.0.1:8000.`
      );
    }
    if (res.status === 403 && raw.toLowerCase().includes("csrf")) {
      throw new Error(
        "Login blocked (CSRF). Backend was updated to exempt JWT login — restart Django (runserver)."
      );
    }
    const msg = formatAuthErrorPayload(parsed, res.status);
    if (msg === "Login failed." && raw.length && raw.length < 400) {
      throw new Error(`${msg} (${res.status}): ${raw}`);
    }
    throw new Error(msg);
  }
  if (!data.access || !data.refresh) {
    throw new Error(
      `Invalid login response (missing tokens). Status ${res.status}. First bytes: ${raw.slice(0, 120)}`
    );
  }
  return data;
}

export async function refreshRequest(refresh: string): Promise<{ access: string }> {
  const res = await fetch(resolveClientApiUrl("/api/auth/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  });
  const data = (await res.json().catch(() => ({}))) as { access?: string; detail?: string };
  if (!res.ok || !data.access) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Refresh failed");
  }
  return { access: data.access };
}

export async function meRequest(accessToken: string): Promise<PortalUser> {
  const res = await fetch(resolveClientApiUrl("/api/auth/me/"), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = (await res.json().catch(() => ({}))) as PortalUser & { detail?: string };
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Not authenticated");
  }
  return data as PortalUser;
}

/** Resolve current user for UI (JWT portal or simple DRF token login). */
export async function fetchPortalIdentity(): Promise<PortalUser | null> {
  const jwt = readStoredAccess();
  if (jwt) {
    try {
      return await meRequest(jwt);
    } catch {
      return null;
    }
  }
  const drf = readStoredDrfToken();
  if (!drf) return null;
  const res = await fetch(resolveClientApiUrl("/api/syndicate-auth/me/"), {
    headers: { Authorization: `Token ${drf}`, Accept: "application/json" }
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: number;
    email?: string;
    username?: string;
    is_staff?: boolean;
    detail?: string;
  };
  if (!res.ok || data.id == null) return null;
  const email = String(data.email ?? "").trim();
  return {
    id: data.id,
    username: String(data.username ?? email).trim() || email,
    email,
    first_name: "",
    last_name: "",
    is_staff: !!data.is_staff,
    roles: [],
    permissions: []
  };
}

export async function logoutRequest(accessToken: string): Promise<void> {
  await fetch(resolveClientApiUrl("/api/auth/logout/"), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

/**
 * Fetch a binary PDF (membership article) with JWT. Use blob URLs for inline viewing.
 */
export async function fetchAuthenticatedPdfBlob(apiPath: string): Promise<Blob> {
  const url = resolveClientApiUrl(apiPath.startsWith("/") ? apiPath : `/${apiPath}`);
  const headers = new Headers();
  const auth = getAuthorizationHeader();
  if (auth) headers.set("Authorization", auth);
  const res = await fetch(url, { headers, credentials: "omit" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 240) || `PDF request failed (${res.status})`);
  }
  return res.blob();
}

export async function portalFetch<T>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean; timeoutMs?: number }
): Promise<{ ok: boolean; status: number; data: T }> {
  const skipAuth = init?.skipAuth;
  const timeoutMs = init?.timeoutMs ?? 60_000;
  const { skipAuth: _sa, timeoutMs: _tm, ...restInit } = init ?? {};

  const url = path.startsWith("http") ? path : resolveClientApiUrl(path.startsWith("/") ? path : `/${path}`);

  const buildHeaders = (authorization: string | null): Headers => {
    const headers = new Headers(restInit.headers);
    if (!skipAuth && authorization) headers.set("Authorization", authorization);
    if (restInit.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return headers;
  };

  const parseBody = async (res: Response): Promise<T> => {
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  };

  const userSignal = restInit.signal;
  const ctrl = new AbortController();
  let tid: ReturnType<typeof setTimeout> | undefined;
  if (!userSignal && timeoutMs > 0) {
    tid = setTimeout(() => ctrl.abort(), timeoutMs);
  }
  const signal = userSignal ?? ctrl.signal;

  const cleanup = () => {
    if (tid !== undefined) clearTimeout(tid);
  };

  let authorization: string | null = skipAuth ? null : getAuthorizationHeader();

  try {
    let res = await fetch(url, { ...restInit, signal, headers: buildHeaders(authorization) });

    if (res.status === 401 && !skipAuth && readStoredAccess() && readStoredRefresh()) {
      const rt = readStoredRefresh();
      if (rt) {
        try {
          const { access } = await refreshRequest(rt);
          persistTokens(access, rt);
          authorization = getAuthorizationHeader();
          res = await fetch(url, { ...restInit, signal, headers: buildHeaders(authorization) });
        } catch {
          /* return the original 401 below */
        }
      }
    }

    const data = await parseBody(res);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const hint = getApiDisplayHint();
    const detail =
      name === "AbortError"
        ? `Request timed out after ${Math.round(timeoutMs / 1000)}s. Start Django on port 8000 or set BACKEND_INTERNAL_URL / NEXT_PUBLIC_API_BASE (${hint}).`
        : `Cannot reach API (${hint}).${e instanceof Error && e.message ? ` ${e.message}` : ""}`;
    return { ok: false, status: 0, data: { detail } as unknown as T };
  } finally {
    cleanup();
  }
}
