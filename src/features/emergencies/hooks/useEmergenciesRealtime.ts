import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { emergencyKeys } from "../api/emergencies.keys";

const EMERGENCY_EVENTS = [
  "emergency.triggered",
  "emergency.acknowledged",
  "emergency.resolved",
  "emergency.cancelled",
];

/**
 * Realtime for emergencies. These broadcast on the general (private) org
 * channel `organizations.{id}` (members only). On any emergency event we
 * invalidate the emergency query tree. No-op when realtime is off.
 */
export function useEmergenciesRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useOrgChannel(
    activeId ? `organizations.${activeId}` : null,
    EMERGENCY_EVENTS,
    () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: emergencyKeys.all(activeId) });
      }
    },
  );
}
