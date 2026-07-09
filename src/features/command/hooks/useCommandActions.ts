import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commandApi } from "../api/command.api";
import { commandKeys } from "../api/command.keys";

/** Command incident actions (SuperAdmin). Invalidate the command tree on success. */
export function useCommandIncidentActions(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: commandKeys.all() });

  return {
    act: useMutation({
      mutationFn: (action: string) => commandApi.actOnIncident(id, action),
      onSuccess,
    }),
    dispatch: useMutation({
      mutationFn: (unitId: string) => commandApi.dispatchUnit(id, { unit_id: unitId }),
      onSuccess,
    }),
  };
}

/** Route (open) a new command incident (SuperAdmin). */
export function useRouteIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { severity: string; summary: string; category?: string; source_type?: string }) =>
      commandApi.routeIncident(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commandKeys.all() }),
  });
}

/** Create an agency (SuperAdmin). */
export function useCreateAgency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      code: string;
      name: string;
      country?: string;
      categories: string[];
      hotline?: string;
      status?: string;
    }) => commandApi.createAgency(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commandKeys.all() }),
  });
}

/** Create a command unit under an agency (SuperAdmin). */
export function useCreateCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { agency_id: string; tier: string; name: string; area?: string }) =>
      commandApi.createCommand(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commandKeys.all() }),
  });
}
