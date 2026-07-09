import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { emergenciesApi } from "../api/emergencies.api";
import { emergencyKeys } from "../api/emergencies.keys";

/** Emergency coordination actions (server-confirmed; invalidate on success). */
export function useEmergencyActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const onSuccess = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all(activeId) });
    }
  };

  return {
    acknowledge: useMutation({
      mutationFn: () => emergenciesApi.acknowledge(activeId as string, id),
      onSuccess,
    }),
    resolve: useMutation({
      mutationFn: (resolution?: string) =>
        emergenciesApi.resolve(activeId as string, id, resolution),
      onSuccess,
    }),
    cancel: useMutation({
      mutationFn: () => emergenciesApi.cancel(activeId as string, id),
      onSuccess,
    }),
  };
}
