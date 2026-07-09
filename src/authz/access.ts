/**
 * Authorization access rules — UX gating only.
 *
 * The Sentrix backend is the single source of truth for RBAC and authorizes
 * every API call. This module never re-implements that logic; it only decides
 * what shell/navigation to *show*, based on the identity returned by
 * `GET /api/v1/auth/me` (roles + permissions). SuperAdmin is allow-all, mirroring
 * the backend's Gate::before.
 *
 * Permission keys here MUST match the backend `DefaultPermission` enum values
 * (e.g. "incidents.view"). See sentrix-backend Authorization domain.
 */

import type { Principal } from "../services/api/types";
import {
  belongsToAnyOrganization,
  hasPermission,
  hasRole,
  isSuperAdmin,
} from "../lib/principal";

export interface AccessRule {
  /** Visible if the principal holds ANY of these permissions. */
  anyPermission?: string[];
  /** Visible if the principal holds ANY of these roles. */
  anyRole?: string[];
  /** Visible only to platform SuperAdmins. */
  superAdminOnly?: boolean;
  /**
   * Also visible to any organization member, regardless of specific permissions.
   *
   * No longer used by the nav or action gates now that `/auth/me` is org-team
   * scoped (permissions are accurate per org). Kept as a capability for cases
   * where coarse "any member" visibility is intentionally desired.
   */
  orgMemberFallback?: boolean;
}

/**
 * Evaluate an access rule against the principal. An undefined/empty rule means
 * "any authenticated principal".
 */
export function isAllowed(
  rule: AccessRule | undefined,
  principal: Principal | null,
): boolean {
  if (!principal) return false;

  // SuperAdmin sees everything.
  if (isSuperAdmin(principal)) return true;

  if (!rule) return true;
  if (rule.superAdminOnly) return false; // already handled SuperAdmin above

  const noConstraints =
    !rule.anyPermission && !rule.anyRole && !rule.orgMemberFallback;
  if (noConstraints) return true;

  let allowed = false;
  if (rule.anyPermission) {
    allowed = rule.anyPermission.some((p) => hasPermission(principal, p));
  }
  if (!allowed && rule.anyRole) {
    allowed = rule.anyRole.some((r) => hasRole(principal, r));
  }
  if (!allowed && rule.orgMemberFallback) {
    allowed = belongsToAnyOrganization(principal);
  }
  return allowed;
}
