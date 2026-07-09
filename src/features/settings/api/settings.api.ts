import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Invitation, Member, OrganizationDetails } from "./settings.types";

export const settingsApi = {
  organization(orgId: string): Promise<ApiResult<OrganizationDetails>> {
    return apiClient.get<OrganizationDetails>(`organizations/${orgId}`);
  },

  members(orgId: string): Promise<ApiResult<Member[]>> {
    return apiClient.get<Member[]>(`organizations/${orgId}/members`);
  },

  invitations(orgId: string): Promise<ApiResult<Invitation[]>> {
    return apiClient.get<Invitation[]>(`organizations/${orgId}/invitations`);
  },

  // --- Write actions (org-admin; server-confirmed, permission-enforced) ---
  updateOrganization(
    orgId: string,
    payload: { name?: string; slug?: string; region?: string | null },
  ): Promise<ApiResult<OrganizationDetails>> {
    return apiClient.patch<OrganizationDetails>(`organizations/${orgId}`, payload);
  },
  updateMemberRole(orgId: string, userId: string, role: string): Promise<ApiResult<Member>> {
    return apiClient.patch<Member>(`organizations/${orgId}/members/${userId}`, { role });
  },
  removeMember(orgId: string, userId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`organizations/${orgId}/members/${userId}`);
  },
  invite(
    orgId: string,
    payload: { email: string; role: string },
  ): Promise<ApiResult<Invitation>> {
    return apiClient.post<Invitation>(`organizations/${orgId}/invitations`, payload);
  },
  revokeInvitation(orgId: string, invitationId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`organizations/${orgId}/invitations/${invitationId}`);
  },

  createOrganization(
    payload: { name: string; slug?: string; region?: string },
  ): Promise<ApiResult<OrganizationDetails>> {
    return apiClient.post<OrganizationDetails>("organizations", payload);
  },

  // --- Owner-level actions ---
  transferOwnership(orgId: string, userId: string): Promise<ApiResult<OrganizationDetails>> {
    return apiClient.post<OrganizationDetails>(`organizations/${orgId}/transfer-ownership`, {
      user_id: userId,
    });
  },
  deleteOrganization(orgId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`organizations/${orgId}`);
  },
};
