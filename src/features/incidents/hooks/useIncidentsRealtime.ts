import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { incidentKeys } from "../api/incidents.keys";

const INCIDENT_EVENTS = [
  "incident.opened",
  // Fired by IncidentStatusChanged when startInvestigation() transitions open → investigating.
  "incident.status_changed",
  "incident.escalated",
  "incident.resolved",
  "incident.closed",
  // Fired by IncidentAuthoritiesNotified (manual record — no automated dispatch).
  "incident.authorities_notified",
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
