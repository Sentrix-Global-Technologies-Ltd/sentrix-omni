import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { evidenceApi } from "../api/evidence.api";
import { evidenceKeys } from "../api/evidence.keys";

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
