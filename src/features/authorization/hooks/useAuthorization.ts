import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { authzApi } from "../api/authz.api";
import type { CreateRoleInput, UpdateRoleInput } from "../api/authz.api";

export function useRoles() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["authz", activeId ?? "none", "roles"],
    queryFn: () => authzApi.roles(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function usePermissionCatalogue(page?: number) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["authz", activeId ?? "none", "permissions", page ?? 1],
    queryFn: () => authzApi.permissions(activeId as string, page),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

/**
 * The full permission catalogue in one page, for picker UIs (create/edit role
 * forms). Org permission catalogues are small, bounded lists, so a generously
 * large per_page avoids building pagination-aware picker UI.
 */
export function usePermissionPicker() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["authz", activeId ?? "none", "permissions", "picker"],
    queryFn: () => authzApi.permissions(activeId as string, 1, 100),
    enabled: Boolean(activeId),
  });
}

function useInvalidateRoles() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: ["authz", activeId, "roles"] });
    }
  };
}

/** Create an organization role (roles.manage). */
export function useCreateRole() {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidateRoles();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => authzApi.createRole(activeId as string, data),
    onSuccess,
  });
}

/** Rename a role and/or replace its permission set (roles.manage). */
export function useUpdateRole(roleId: string) {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidateRoles();
  return useMutation({
    mutationFn: (data: UpdateRoleInput) => authzApi.updateRole(activeId as string, roleId, data),
    onSuccess,
  });
}

/** Delete a custom role (roles.manage). Default/system roles are rejected server-side. */
export function useDeleteRole(roleId: string) {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidateRoles();
  return useMutation({
    mutationFn: () => authzApi.deleteRole(activeId as string, roleId),
    onSuccess,
  });
}
