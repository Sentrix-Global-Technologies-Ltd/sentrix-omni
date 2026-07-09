import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { incidentKeys } from "../api/incidents.keys";

const INCIDENT_EVENTS = [
  "incident.opened",
  "incident.escalated",
  "incident.resolved",
  "incident.closed",
];

/**
 * Realtime convention: subscribe to the org incidents channel and invalidate the
 * incident query tree on any incident event (server stays source of truth).
 * Returns `{ connected }` for a RealtimeIndicator. No-op when realtime is off.
 */
export function useIncidentsRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useOrgChannel(
    activeId ? `organizations.${activeId}.incidents` : null,
    INCIDENT_EVENTS,
    () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
      }
    },
  );
}
