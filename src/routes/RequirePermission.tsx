import { Navigate, Outlet } from "react-router";
import { useAuthz } from "../hooks/useAuthz";
import type { AccessRule } from "../authz/access";
import Forbidden from "../pages/OtherPage/Forbidden";

/**
 * Route-level authorization guard (defense-in-depth behind the role-aware nav).
 * Renders the matched route only when the API identity satisfies `rule`,
 * otherwise shows the in-shell Forbidden page. Sits inside ProtectedRoute, so
 * authentication is already guaranteed.
 *
 * `requireOrgMembership` is checked independently of `rule`/SuperAdmin-allow-all
 * — mirrors the same flag on NavItem (see config/navigation.tsx): a couple of
 * routes (Billing's personal subscription self-service) have nothing to do
 * with admin authority and must stay hidden from organization-less platform
 * staff, SuperAdmin included.
 */
export default function RequirePermission({
  rule,
  requireOrgMembership,
  redirectSuperAdminTo,
}: {
  rule?: AccessRule;
  requireOrgMembership?: boolean;
  /**
   * SuperAdmins are sent here instead of the route (mirrors NavItem.hideForSuperAdmin):
   * the page is org-scoped and a SuperAdmin's only org is Sentrix's internal one.
   */
  redirectSuperAdminTo?: string;
}) {
  const { isAllowed, isOrgMember, isSuperAdmin } = useAuthz();
  if (redirectSuperAdminTo && isSuperAdmin) return <Navigate to={redirectSuperAdminTo} replace />;
  const allowed = isAllowed(rule) && (!requireOrgMembership || isOrgMember);
  return allowed ? <Outlet /> : <Forbidden />;
}
