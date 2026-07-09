import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { assignmentsApi } from "../api/assignments.api";
import { assignmentKeys } from "../api/assignments.keys";

/**
 * Ranked candidate responders for this assignment — proximity to the incident
 * when it has coordinates, otherwise presence recency (the same heuristic the
 * async AI-dispatch pipeline uses, exposed synchronously). Replaces the
 * client-side "sort by last_seen_at" stand-in that AddResponderAction used
 * before this endpoint existed.
 */
export function useAssignmentRecommendations(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: assignmentKeys.recommendations(activeId ?? "none", id),
    queryFn: () => assignmentsApi.recommendations(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}

/** Assignment dispatch actions (server-confirmed; invalidate on success). */
export function useAssignmentActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const onSuccess = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
    }
  };

  return {
    cancel: useMutation({
      mutationFn: () => assignmentsApi.cancel(activeId as string, id),
      onSuccess,
    }),
    complete: useMutation({
      mutationFn: () => assignmentsApi.complete(activeId as string, id),
      onSuccess,
    }),
    addResponder: useMutation({
      mutationFn: (vars: { responderId: string; role?: string }) =>
        assignmentsApi.addResponder(activeId as string, id, vars.responderId, vars.role),
      onSuccess,
    }),
  };
}

/**
 * Per-responder-line lifecycle actions for one assignment (dispatcher-driven).
 * Each mutation takes the line id; decline also accepts a reason.
 */
export function useResponderLineActions(assignmentId: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const onSuccess = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
    }
  };

  return {
    accept: useMutation({
      mutationFn: (lineId: string) => assignmentsApi.acceptLine(activeId as string, assignmentId, lineId),
      onSuccess,
    }),
    decline: useMutation({
      mutationFn: (vars: { lineId: string; reason?: string }) =>
        assignmentsApi.declineLine(activeId as string, assignmentId, vars.lineId, vars.reason),
      onSuccess,
    }),
    enRoute: useMutation({
      mutationFn: (lineId: string) => assignmentsApi.enRouteLine(activeId as string, assignmentId, lineId),
      onSuccess,
    }),
    onScene: useMutation({
      mutationFn: (lineId: string) => assignmentsApi.onSceneLine(activeId as string, assignmentId, lineId),
      onSuccess,
    }),
    complete: useMutation({
      mutationFn: (lineId: string) => assignmentsApi.completeLine(activeId as string, assignmentId, lineId),
      onSuccess,
    }),
  };
}
