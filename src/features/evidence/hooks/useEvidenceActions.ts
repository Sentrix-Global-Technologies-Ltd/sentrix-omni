import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { evidenceApi } from "../api/evidence.api";
import { evidenceKeys } from "../api/evidence.keys";

function requireActiveOrganization(activeId: string | null): string {
  if (!activeId) throw new Error("No active organization.");
  return activeId;
}

/**
 * Observation actions (hold / bookmark toggles). Server-confirmed; invalidate the
 * evidence query tree on success (search + stats refetch).
 */
export function useObservationActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: evidenceKeys.all(activeId) });
  };

  return {
    hold: useMutation({
      mutationFn: (next: boolean) => evidenceApi.hold(activeId as string, id, next),
      onSuccess,
    }),
    bookmark: useMutation({
      mutationFn: (next: boolean) => evidenceApi.bookmark(activeId as string, id, next),
      onSuccess,
    }),
  };
}

/** Evidence Collection mutations (create/rename/delete/add/remove members). */
export function useEvidenceCollectionActions() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: evidenceKeys.all(activeId) });
  };

  return {
    create: useMutation({
      mutationFn: (payload: { name: string; description?: string; observation_ids?: string[] }) =>
        evidenceApi.createCollection(requireActiveOrganization(activeId), payload),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; name?: string; description?: string }) =>
        evidenceApi.updateCollection(requireActiveOrganization(activeId), vars.id, vars),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => evidenceApi.deleteCollection(requireActiveOrganization(activeId), id),
      onSuccess,
    }),
    addObservations: useMutation({
      mutationFn: (vars: { id: string; observationIds: string[] }) =>
        evidenceApi.addToCollection(requireActiveOrganization(activeId), vars.id, vars.observationIds),
      onSuccess,
    }),
    removeObservations: useMutation({
      mutationFn: (vars: { id: string; observationIds: string[] }) =>
        evidenceApi.removeFromCollection(requireActiveOrganization(activeId), vars.id, vars.observationIds),
      onSuccess,
    }),
  };
}
