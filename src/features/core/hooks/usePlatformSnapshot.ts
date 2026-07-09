import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { coreApi } from "../api/core.api";

/**
 * Platform-wide (SuperAdmin) snapshot off the SentrixCore bridge. Distinct
 * from the org-scoped Operations Command Center (dashboard home /,
 * `src/features/dashboard`) — that's a separate, dispatcher-facing page.
 */
export function usePlatformSnapshot() {
  const { principal } = useAuth();
  return useQuery({
    queryKey: ["core", "platform-snapshot"],
    queryFn: () => coreApi.platformSnapshot(),
    enabled: Boolean(principal),
  });
}
