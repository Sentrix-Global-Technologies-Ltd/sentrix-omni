import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { accessKeys } from "../api/access.keys";

// PassIssued/PassRevoked/GateScanned all use the `pass.*`/`gate.*` action
// prefixes, which OrganizationBroadcastEvent doesn't special-case, so they
// fall through to the general org channel (see useEmergenciesRealtime for the
// same fallback-channel pattern).
const ACCESS_EVENTS = ["pass.issued", "pass.revoked", "gate.scanned"];

/**
 * Realtime for Access Control (passes + gate log). Broadcasts on the general
 * (private) org channel `organizations.{id}` (members only). On any pass or
 * gate event we invalidate the access query tree so both tabs refresh live.
 * No-op when realtime is off.
 */
export function useAccessRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useOrgChannel(
    activeId ? `organizations.${activeId}` : null,
    ACCESS_EVENTS,
    () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: accessKeys.all(activeId) });
      }
    },
  );
}
