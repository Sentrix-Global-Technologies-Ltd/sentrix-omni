import { useQueryClient } from "@tanstack/react-query";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { commandKeys } from "../api/command.keys";

// Command & CAD are platform-scoped (no organization_id), so they broadcast on
// the single `platform` channel (see PlatformBroadcastEvent) rather than an
// organizations.{id}.* channel — sibling pattern to useOrgChannel's org
// channels, just with a fixed, non-org-scoped channel name.
const COMMAND_EVENTS = [
  "command.incident_actioned",
  "command.incident_routed",
  "cad.unit_dispatched",
  "cad.bolo_issued",
];

/**
 * Realtime for the Command Console (Command + Cad domains). On any of the
 * above events we invalidate the whole command query tree — low volume,
 * platform-wide, so one broad invalidation is simpler than tracking which
 * sub-query each event affects. Returns `{ connected }` for a
 * RealtimeIndicator. No-op when realtime is off.
 */
export function useCommandRealtime(): { connected: boolean } {
  const queryClient = useQueryClient();

  return useOrgChannel("platform", COMMAND_EVENTS, () => {
    queryClient.invalidateQueries({ queryKey: commandKeys.all() });
  });
}
