import { useQueryClient } from "@tanstack/react-query";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { coordinationKeys } from "../api/coordination.keys";

// Coordination is platform-scoped (no organization_id), same as Command/Cad, so
// it broadcasts on the single `platform` channel (see PlatformBroadcastEvent).
// Subscribing again here (alongside useCommandRealtime on the same page) is
// safe and cheap: reverbClient reference-counts handlers per channel rather
// than opening a second socket subscription (see realtime/reverbClient.ts).
const COORDINATION_EVENTS = [
  "coordination.mutual_aid_requested",
  "coordination.tasking_routed",
  "coordination.unit_message_sent",
];

/**
 * Realtime for Coordination (mutual aid, unit comms, taskings, duty book). On
 * any of the above events we invalidate the whole coordination query tree.
 * Returns `{ connected }` for a RealtimeIndicator. No-op when realtime is off.
 */
export function useCoordinationRealtime(): { connected: boolean } {
  const queryClient = useQueryClient();

  return useOrgChannel("platform", COORDINATION_EVENTS, () => {
    queryClient.invalidateQueries({ queryKey: coordinationKeys.all() });
  });
}
