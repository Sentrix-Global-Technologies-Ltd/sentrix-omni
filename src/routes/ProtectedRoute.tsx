import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/common/FullScreenLoader";

/**
 * Gate for authenticated areas. While the session is resolving we show a
 * loader; guests are redirected to sign-in (preserving the intended URL).
 */
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
