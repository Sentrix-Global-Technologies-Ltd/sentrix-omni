import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  belongsToAnyOrganization,
  hasPermission,
  hasRole,
  isSuperAdmin,
} from "../lib/principal";
import { isAllowed, type AccessRule } from "../authz/access";

/**
 * Authorization helpers derived from the API identity. UX gating only — the
 * backend remains authoritative. Use in components/nav to decide what to render.
 */
export function useAuthz() {
  const { principal } = useAuth();

  return useMemo(
    () => ({
      principal,
      isAuthenticated: principal !== null,
      isSuperAdmin: principal ? isSuperAdmin(principal) : false,
      isOrgMember: principal ? belongsToAnyOrganization(principal) : false,
      can: (permission: string) =>
        principal ? hasPermission(principal, permission) : false,
      canAny: (permissions: string[]) =>
        principal ? permissions.some((p) => hasPermission(principal, p)) : false,
      hasRole: (role: string) => (principal ? hasRole(principal, role) : false),
      isAllowed: (rule: AccessRule | undefined) => isAllowed(rule, principal),
    }),
    [principal],
  );
}
