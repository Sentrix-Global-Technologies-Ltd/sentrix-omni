/**
 * Authentication endpoints — a thin, typed mirror of the backend `/api/v1/auth`
 * contracts. The template every future endpoint module follows.
 *
 *   POST auth/login   { email, password, device_name } -> data: { user, token, refresh_token }
 *   POST auth/refresh (Bearer <refresh_token>)         -> data: { token, refresh_token } (rotated)
 *   GET  auth/me      (?with_permissions=1)            -> data: Principal
 *   POST auth/logout                                   -> revokes current token
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
};
