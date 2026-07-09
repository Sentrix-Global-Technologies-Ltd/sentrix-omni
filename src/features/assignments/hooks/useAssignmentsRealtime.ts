import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { assignmentKeys } from "../api/assignments.keys";

// Dispatch lifecycle + per-responder line events.
const ASSIGNMENT_EVENTS = [
  "assignment.created",
  "assignment.cancelled",
  "assignment.completed",
  "assignment.dispatch_escalated",
  "assignment.responder_offered",
  "assignment.responder_accepted",
  "assignment.responder_declined",
  "assignment.responder_en_route",
  "assignment.responder_on_scene",
  "assignment.responder_completed",
  "assignment.responder_stood_down",
  "assignment.responder_timed_out",
];

/**
 * Realtime for assignments — private channel `organizations.{id}.assignments`.
 * On any dispatch/line event we invalidate the assignment query tree. No-op when
 * realtime is off.
 */
export function useAssignmentsRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useOrgChannel(
    activeId ? `organizations.${activeId}.assignments` : null,
    ASSIGNMENT_EVENTS,
    () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
      }
    },
  );
}
