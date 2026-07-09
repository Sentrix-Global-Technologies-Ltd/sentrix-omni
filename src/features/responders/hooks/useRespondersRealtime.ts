import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { responderKeys } from "../api/responders.keys";
import { profileKeys } from "../api/profile.keys";

// Roster-relevant events (location pings are intentionally excluded to avoid
// churn). Duty-shift events broadcast on this same presence channel (see
// DutyShiftScheduled/DutyShiftCancelled — both use the "responder" action
// prefix, routed here by OrganizationBroadcastEvent, no new channel).
const RESPONDER_EVENTS = [
  "responder.status_changed",
  "responder.registered",
  "responder.duty_shift_scheduled",
  "responder.duty_shift_cancelled",
];

/**
 * Realtime convention for responders. The responder channel is a PRESENCE
 * channel; on roster events we invalidate the responder query tree, and on
 * duty-shift events we additionally invalidate the Roster workspace's
 * org-wide shifts query (a separate key tree — see useRoster.ts's own
 * comment on why it needs its own explicit invalidation). Returns
 * `{ connected }` for a RealtimeIndicator. No-op when realtime is off.
 */
export function useRespondersRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useOrgChannel(
    activeId ? `organizations.${activeId}.responders` : null,
    RESPONDER_EVENTS,
    (event) => {
      if (!activeId) return;

      queryClient.invalidateQueries({ queryKey: responderKeys.all(activeId) });

      if (event === "responder.duty_shift_scheduled" || event === "responder.duty_shift_cancelled") {
        queryClient.invalidateQueries({ queryKey: profileKeys.orgShifts(activeId) });
      }
    },
    { presence: true },
  );
}
