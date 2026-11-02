/**
 * Shared API types mirroring the Sentrix backend contracts.
 *
 * Every API response uses the platform envelope:
 *   success: { success: true,  message, data, (meta, links) }
 *   error:   { success: false, message, errors }
 */

export interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  /** Stable machine-readable error code (error responses only). */
  code?: string;
  /** Correlation ID for tracing a failure in server logs (error responses only). */
  request_id?: string;
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

/** A successful, unwrapped response handed to callers by the client. */
export interface ApiResult<T> {
  data: T;
  message: string;
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  [key: string]: unknown;
}

/** The authenticated principal, from `GET /api/v1/auth/me`. */
export interface Principal {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified?: boolean;
  /** Public URL of the uploaded avatar, or null if none has been set. */
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  city_state: string | null;
  postal_code: string | null;
  tax_id: string | null;
  current_organization_id: string | null;
  current_organization: Organization | null;
  organizations: Organization[];
  roles: string[];
  permissions: string[];
  created_at?: string;
}

/** `POST /api/v1/auth/login` (and `/auth/refresh`) data payload. */
export interface LoginResponse {
  /** Access token. Alias of `access_token`, kept for backward compatibility. */
  token: string;
  /** Short-lived access token (sent on every request). */
  access_token?: string;
  /** Long-lived refresh token (exchanged at /auth/refresh for a new pair). */
  refresh_token?: string;
  /** ISO-8601 access-token expiry. */
  expires_at?: string;
  user: Principal;
}
