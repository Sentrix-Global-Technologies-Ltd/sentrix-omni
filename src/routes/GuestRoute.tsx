import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/common/FullScreenLoader";

/**
 * Gate for guest-only pages (sign-in). Authenticated users are sent to the
 * console home so they never see the login screen while signed in.
 */
export default function GuestRoute() {
  const { status } = useAuth();

  if (status === "loading") return <FullScreenLoader />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}
