import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { reverbClient } from "../../../realtime/reverbClient";
import { assignmentKeys } from "../api/assignments.keys";
import { incidentKeys } from "../../incidents/api/incidents.keys";

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
 * On any dispatch/line event we invalidate:
 *   - the assignment query tree (assignment list + detail pages)
 *   - the incident query tree (incident detail embeds the current assignment
 *     and timeline; both must refresh when dispatch state changes)
 *
 * Reconnect recovery: when the WebSocket re-establishes after a drop we
 * immediately invalidate both caches so any events missed during the outage
 * are reconciled from the server rather than left stale.
 *
 * No-op when realtime is off.
 */
export function useAssignmentsRealtime(): { connected: boolean } {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  // Keep a stable reference to the invalidation callback so the reconnect
  // effect below only registers once, regardless of activeId changes.
  const invalidateRef = useRef<() => void>(() => {});
  invalidateRef.current = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
      // Incident detail embeds assignment + timeline; refresh so the Response
      // Log and assignment summary stay current without a manual reload.
      queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
    }
  };

  // Reconnect recovery: invalidate caches on the false→true status transition
  // so missed events during a connection gap are reconciled from the server.
  useEffect(() => {
    let wasConnected = false;
    return reverbClient.onStatus((isConnected: boolean) => {
      if (isConnected && !wasConnected) {
        invalidateRef.current();
      }
      wasConnected = isConnected;
    });
  }, []); // register once; invalidateRef.current stays current via the ref

  return useOrgChannel(
    activeId ? `organizations.${activeId}.assignments` : null,
    ASSIGNMENT_EVENTS,
    () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
        queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
      }
    },
  );
}
