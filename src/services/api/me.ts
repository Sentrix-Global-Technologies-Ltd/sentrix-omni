/**
 * The authenticated user's own profile — a thin, typed mirror of the backend
 * `/api/v1/me` contracts (distinct from `auth/me`, which returns the same
 * user enriched with org/role context; see auth.ts). Every authenticated
 * user of any role can call these on themselves — no permission required.
 *
 *   PATCH me         { name?, phone?, bio?, country?, city_state?, postal_code?, tax_id? } -> data: Principal
 *   POST  me/avatar   multipart: avatar=<file>                                             -> data: Principal
 *   DELETE me/avatar                                                                        -> data: Principal
 */

import { apiClient } from "./client";
import type { ApiResult, Principal } from "./types";

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  bio?: string | null;
  country?: string | null;
  city_state?: string | null;
  postal_code?: string | null;
  tax_id?: string | null;
}

export const meApi = {
  updateProfile(payload: UpdateProfileInput): Promise<ApiResult<Principal>> {
    return apiClient.patch<Principal>("me", payload);
  },

  uploadAvatar(file: File): Promise<ApiResult<Principal>> {
    const form = new FormData();
    form.append("avatar", file);
    return apiClient.postForm<Principal>("me/avatar", form);
  },

  deleteAvatar(): Promise<ApiResult<Principal>> {
    return apiClient.delete<Principal>("me/avatar");
  },
};
