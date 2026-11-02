/**
 * The single gateway between the Sentrix Console and the Sentrix API.
 *
 * Responsibilities (transport only — no domain logic):
 *   - target the configured `/api/v1` base URL;
 *   - attach the sessionStorage bearer token (and `X-Organization` when scoped);
 *   - unwrap the `{ success, message, data, meta, links }` envelope into ApiResult;
 *   - map failures to typed errors (see ./errors);
 *   - on 401, attempt one silent refresh (rotating refresh token) and retry the
 *     call; if that fails, clear the tokens and notify the registered handler so
 *     the app logs the user out automatically (token invalidation).
 *
 * Endpoint modules (authApi, …) build on this; UI never calls fetch directly.
 */

import { env } from "../../config/env";
import { errorFromStatus, NetworkError, SAFE_MESSAGES, ServerError } from "./errors";
import { tokenStorage } from "./tokenStorage";
import type { ApiResult, Envelope } from "./types";

type UnauthorizedHandler = () => void;
/** Returns true if a fresh access token was obtained (so the call can retry). */
type RefreshHandler = () => Promise<boolean>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshHandler: RefreshHandler | null = null;
let activeOrganizationId: string | null = null;

// De-duplicate concurrent refreshes: when several calls 401 at once they all
// await the same single /auth/refresh so the rotating token is used exactly once.
let refreshing: Promise<boolean> | null = null;

function attemptRefresh(): Promise<boolean> {
  if (!refreshHandler) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = refreshHandler().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Attach the bearer token (default true). Set false for public endpoints. */
  auth?: boolean;
  /** Override the bearer token (used by the refresh call to send the refresh token). */
  bearer?: string;
  /** Skip the silent-refresh-on-401 dance (used by the refresh call itself). */
  skipRefresh?: boolean;
  /** Internal: marks the single post-refresh retry so we never loop. */
  _retry?: boolean;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${env.apiBaseUrl}/${path.replace(/^\/+/, "")}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { body, query, auth = true, bearer, skipRefresh = false, _retry = false } = options;

  // FormData (file uploads) must NOT get a JSON Content-Type or be
  // stringified — the browser sets the correct multipart boundary itself.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  // An explicit `bearer` (refresh token) wins; otherwise use the stored access
  // token when the call is authed. `X-Organization` only rides on authed calls.
  const token = bearer ?? (auth ? tokenStorage.get() : null);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (auth && activeOrganizationId) headers["X-Organization"] = activeOrganizationId;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError(SAFE_MESSAGES.network, 0);
  }

  if (response.status === 401) {
    // Silent refresh: the access token likely expired. Try once to mint a new
    // pair (rotating refresh token) and replay the original call.
    if (auth && !skipRefresh && !_retry) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        return request<T>(method, path, { ...options, _retry: true });
      }
    }
    // Refresh unavailable or failed — invalidate and notify so the app can
    // redirect to sign-in regardless of which call tripped it. Public calls
    // (e.g. login with a bad password) have no session to invalidate: their 401
    // is just a failed attempt and must not log the app out or clear tokens.
    // The refresh call itself (auth:false + skipRefresh) still invalidates.
    if (auth || skipRefresh) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
  }

  let payload: Envelope<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as Envelope<T>;
    } catch {
      payload = null;
    }
  }

  const failed = !response.ok || (payload?.success === false);
  if (failed) {
    // Only trust well-typed fields from the body; errorFromStatus decides what
    // is safe to show (it never surfaces server text for 5xx).
    const body = payload !== null && typeof payload === "object" ? payload : null;
    throw errorFromStatus(
      response.status,
      typeof body?.message === "string" ? body.message : "",
      body?.errors,
      typeof body?.code === "string" ? body.code : undefined,
      typeof body?.request_id === "string" ? body.request_id : undefined,
    );
  }

  // A success status whose body is not the JSON envelope (an HTML error page
  // from a proxy, a truncated body) is a malformed response, not empty data.
  if (text && (payload === null || typeof payload !== "object")) {
    throw new ServerError(SAFE_MESSAGES.generic, response.status, {}, "malformed_response");
  }

  return {
    data: (payload?.data ?? null) as T,
    message: payload?.message ?? "Success",
    meta: payload?.meta,
    links: payload?.links,
  };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, { ...options, body }),

  /** Multipart file upload (e.g. avatar) — same auth/refresh handling as post(). */
  postForm: <T>(path: string, form: FormData, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body: form }),

  /** Registered by AuthProvider to force logout on 401 (token invalidation). */
  setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    unauthorizedHandler = handler;
  },

  /**
   * Registered by AuthProvider to silently refresh the access token on a 401.
   * Returns true if a fresh token was stored (the failed call is then retried).
   */
  setRefreshHandler(handler: RefreshHandler | null): void {
    refreshHandler = handler;
  },

  /** Scope org-scoped calls to a tenant via the `X-Organization` header. */
  setActiveOrganizationId(id: string | null): void {
    activeOrganizationId = id;
  },
};
