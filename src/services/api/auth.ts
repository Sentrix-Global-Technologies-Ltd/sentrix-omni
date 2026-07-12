/**
 * Authentication endpoints — a thin, typed mirror of the backend `/api/v1/auth`
 * contracts. The template every future endpoint module follows.
 *
 *   POST auth/login           { email, password, device_name } -> data: { user, token, refresh_token }
 *   POST auth/refresh (Bearer <refresh_token>)                 -> data: { token, refresh_token } (rotated)
 *   GET  auth/me              (?with_permissions=1)            -> data: Principal
 *   POST auth/logout                                           -> revokes current token
 *   POST auth/forgot-password { email }                        -> always a generic "check your email" message
 *   POST auth/reset-password  { token, email, password, password_confirmation } -> resets + revokes other sessions
 *
 * `forgot-password`/`reset-password` are public (auth: false) — there is no
 * signed-in session at either step. IdentityServiceProvider builds the
 * emailed link as `{APP_FRONTEND_URL}/password/reset/{token}?email=...`,
 * which is this dashboard's own origin — see pages/AuthPages/ResetPassword.tsx.
 */

import { env } from "../../config/env";
import { apiClient } from "./client";
import type { ApiResult, LoginResponse, Principal } from "./types";

export const authApi = {
  login(email: string, password: string): Promise<ApiResult<LoginResponse>> {
    return apiClient.post<LoginResponse>(
      "auth/login",
      { email, password, device_name: env.deviceName },
      { auth: false },
    );
  },

  /**
   * Exchange a refresh token for a fresh access+refresh pair. Sends the refresh
   * token as the bearer (not the access token) and skips the silent-refresh loop.
   */
  refresh(refreshToken: string): Promise<ApiResult<LoginResponse>> {
    return apiClient.post<LoginResponse>("auth/refresh", undefined, {
      auth: false,
      bearer: refreshToken,
      skipRefresh: true,
    });
  },

  me(): Promise<ApiResult<Principal>> {
    return apiClient.get<Principal>("auth/me", {
      query: { with_permissions: 1 },
    });
  },

  logout(): Promise<ApiResult<null>> {
    return apiClient.post<null>("auth/logout");
  },

  /** Always resolves with a generic message — the backend never reveals
   *  whether the email matched an account (PasswordResetLinkController). */
  forgotPassword(email: string): Promise<ApiResult<null>> {
    return apiClient.post<null>("auth/forgot-password", { email }, { auth: false });
  },

  resetPassword(input: { token: string; email: string; password: string }): Promise<ApiResult<null>> {
    return apiClient.post<null>(
      "auth/reset-password",
      { token: input.token, email: input.email, password: input.password, password_confirmation: input.password },
      { auth: false },
    );
  },
};
