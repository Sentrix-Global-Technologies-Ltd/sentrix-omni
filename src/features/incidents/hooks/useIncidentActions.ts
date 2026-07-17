import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { incidentsApi } from "../api/incidents.api";
import { incidentKeys } from "../api/incidents.keys";
import type { CreateIncidentInput, UpdateIncidentInput } from "../api/incidents.types";

/**
 * Incident workflow actions. Each is a server-confirmed mutation that invalidates
 * the incident query tree on success (the open detail + lists refetch).
 */
export function useIncidentActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const onSuccess = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
    }
  };

  return {
    investigate: useMutation({
      mutationFn: () => incidentsApi.investigate(activeId as string, id),
      onSuccess,
    }),
    escalate: useMutation({
      mutationFn: () => incidentsApi.escalate(activeId as string, id),
      onSuccess,
    }),
    notifyAuthorities: useMutation({
      mutationFn: (notes?: string) => incidentsApi.notifyAuthorities(activeId as string, id, notes),
      onSuccess,
    }),
    resolve: useMutation({
      mutationFn: () => incidentsApi.resolve(activeId as string, id),
      onSuccess,
    }),
    close: useMutation({
      mutationFn: () => incidentsApi.close(activeId as string, id),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (data: UpdateIncidentInput) => incidentsApi.update(activeId as string, id, data),
      onSuccess,
    }),
  };
}

/**
 * Incident create (list-scoped — no id). Invalidates the incident query tree on
 * success so the new incident appears in the list.
 */
export function useIncidentMutations() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: (data: CreateIncidentInput) => incidentsApi.create(activeId as string, data),
      onSuccess: () => {
        if (activeId) {
          queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
        }
      },
    }),
  };
}
