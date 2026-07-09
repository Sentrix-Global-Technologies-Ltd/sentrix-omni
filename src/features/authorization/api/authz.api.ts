import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface Permission {
  id: string;
  name: string;
  guard_name: string;
}

export interface Role {
  id: string;
  name: string;
  guard_name: string;
  organization_id: string | null;
  permissions?: Permission[];
  created_at: string | null;
}

export interface CreateRoleInput {
  name: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: string[];
}

const base = (orgId: string) => `organizations/${orgId}`;

/** Authorization (roles + permission catalogue) — org-scoped. */
export const authzApi = {
  roles(orgId: string): Promise<ApiResult<Role[]>> {
    return apiClient.get<Role[]>(`${base(orgId)}/roles`);
  },
  permissions(orgId: string, page?: number, perPage?: number): Promise<ApiResult<Permission[]>> {
    return apiClient.get<Permission[]>(`${base(orgId)}/permissions`, {
      query: { page, per_page: perPage },
    });
  },
  createRole(orgId: string, data: CreateRoleInput): Promise<ApiResult<Role>> {
    return apiClient.post<Role>(`${base(orgId)}/roles`, data);
  },
  updateRole(orgId: string, roleId: string, data: UpdateRoleInput): Promise<ApiResult<Role>> {
    return apiClient.patch<Role>(`${base(orgId)}/roles/${roleId}`, data);
  },
  deleteRole(orgId: string, roleId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${base(orgId)}/roles/${roleId}`);
  },
};
