import type { ReactNode } from "react";
import { useAuthz } from "../../hooks/useAuthz";
import type { AccessRule } from "../../authz/access";

interface CanProps {
  /** Shorthand for a single required permission. */
  permission?: string;
  /** Visible if the principal has ANY of these permissions. */
  anyPermission?: string[];
  /** Visible if the principal has ANY of these roles. */
  anyRole?: string[];
  /** Visible only to SuperAdmins. */
  superAdminOnly?: boolean;
  /** Also visible to any org member (temporary — see authz/access.ts). */
  orgMemberFallback?: boolean;
  /** Rendered when not permitted (defaults to nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Permission-aware render gate. Shows `children` only when the API identity
 * satisfies the rule; otherwise renders `fallback`. UX gating only — never a
 * substitute for backend authorization.
 *
 *   <Can permission="incidents.view"> <CreateIncidentButton/> </Can>
 */
export default function Can({
  permission,
  anyPermission,
  anyRole,
  superAdminOnly,
  orgMemberFallback,
  fallback = null,
  children,
}: CanProps) {
  const { isAllowed } = useAuthz();

  const rule: AccessRule = {
    anyPermission: permission ? [permission] : anyPermission,
    anyRole,
    superAdminOnly,
    orgMemberFallback,
  };

  return <>{isAllowed(rule) ? children : fallback}</>;
}
