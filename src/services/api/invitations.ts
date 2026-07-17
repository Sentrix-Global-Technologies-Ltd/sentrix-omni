/**
 * The accept-invitation flow — the page the emailed "Accept invitation" link
 * actually opens (`{APP_FRONTEND_URL}/invitations/{token}/accept`, built in
 * OrganizationInvitationNotification::toMail()). All three calls are public
 * (auth: false): the visitor may have no session at all yet.
 *
 *   GET  invitations/{token}/preview             -> data: InvitationPreview
 *   POST invitations/{token}/accept-new-account   { name, password, password_confirmation } -> data: { message }
 *   POST invitations/{token}/accept (auth required) -> data: Organization
 *
 * `acceptExisting` is the one call above that DOES require a session — it's
 * the pre-existing authenticated accept endpoint, used once the visitor is
 * signed in (either they already were, or they just set a password and the
 * page called `useAuth().login()` immediately afterward).
 */

import { apiClient } from "./client";
import type { ApiResult, Organization } from "./types";

export interface InvitationPreview {
  organization_name: string;
  email: string;
  role: string;
  status: "pending" | "expired" | "accepted";
  expires_at: string | null;
  account_exists: boolean;
}

export const invitationsApi = {
  preview(token: string): Promise<ApiResult<InvitationPreview>> {
    return apiClient.get<InvitationPreview>(`invitations/${token}/preview`, { auth: false });
  },

  acceptNewAccount(
    token: string,
    payload: { name: string; password: string },
  ): Promise<ApiResult<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      `invitations/${token}/accept-new-account`,
      { name: payload.name, password: payload.password, password_confirmation: payload.password },
      { auth: false },
    );
  },

  acceptExisting(token: string): Promise<ApiResult<Organization>> {
    return apiClient.post<Organization>(`invitations/${token}/accept`);
  },
};
