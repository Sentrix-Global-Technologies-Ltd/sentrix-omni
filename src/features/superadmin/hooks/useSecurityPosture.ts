import { useQuery } from "@tanstack/react-query";
import { securityApi } from "../api/security.api";

/** Read-only security posture report (Sentrix Console). Config rarely changes,
 * so a longer staleTime avoids re-fetching on every tab focus. */
export function useSecurityPosture() {
  return useQuery({
    queryKey: ["superadmin", "security-posture"],
    queryFn: () => securityApi.posture(),
    staleTime: 60_000,
  });
}
