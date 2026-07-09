import { Outlet } from "react-router";
import { useAuthz } from "../hooks/useAuthz";
import type { AccessRule } from "../authz/access";
import Forbidden from "../pages/OtherPage/Forbidden";

/**
 * Route-level authorization guard (defense-in-depth behind the role-aware nav).
 * Renders the matched route only when the API identity satisfies `rule`,
 * otherwise shows the in-shell Forbidden page. Sits inside ProtectedRoute, so
 * authentication is already guaranteed.
 */
export default function RequirePermission({ rule }: { rule?: AccessRule }) {
  const { isAllowed } = useAuthz();
  return isAllowed(rule) ? <Outlet /> : <Forbidden />;
}
