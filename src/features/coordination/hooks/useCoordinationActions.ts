import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinationApi } from "../api/coordination.api";
import { coordinationKeys } from "../api/coordination.keys";

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: coordinationKeys.all() });
}

/** Request mutual aid between two commands on a routed incident (SuperAdmin). */
export function useRequestAid() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: {
      command_incident_id: string;
      requesting_command_id: string;
      responding_command_id: string;
      message?: string;
    }) => coordinationApi.requestAid(payload),
    onSuccess,
  });
}

/** Accept/decline a mutual-aid request (SuperAdmin). */
export function useMutualAidActions(id: string) {
  const onSuccess = useInvalidate();
  return {
    accept: useMutation({ mutationFn: () => coordinationApi.acceptAid(id), onSuccess }),
    decline: useMutation({ mutationFn: () => coordinationApi.declineAid(id), onSuccess }),
  };
}

/** Send a CAD-to-radio / MDT message on a unit's thread. */
export function useSendUnitMessage(unitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { body: string; direction?: string; command_incident_id?: string }) =>
      coordinationApi.sendMessage(unitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coordinationKeys.all() }),
  });
}

/** Route (open) a new tasking (SuperAdmin). */
export function useRouteTasking() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: { title: string; kind?: string; ref?: string; assignee?: string }) =>
      coordinationApi.routeTasking(payload),
    onSuccess,
  });
}

/** Acknowledge/resolve a tasking (SuperAdmin). */
export function useTaskingActions(id: string) {
  const onSuccess = useInvalidate();
  return {
    acknowledge: useMutation({ mutationFn: () => coordinationApi.acknowledgeTasking(id), onSuccess }),
    resolve: useMutation({ mutationFn: () => coordinationApi.resolveTasking(id), onSuccess }),
  };
}

/** Record a duty-book entry (sign in / sign out / handover). */
export function useRecordDuty() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: {
      action: string;
      scope_type: string;
      scope_id: string;
      person_name: string;
      role?: string;
    }) => coordinationApi.recordDuty(payload),
    onSuccess,
  });
}
