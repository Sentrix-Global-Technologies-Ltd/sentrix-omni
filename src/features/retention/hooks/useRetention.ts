import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { retentionApi } from "../api/retention.api";

export function useStorage() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["retention", activeId ?? "none", "storage"],
    queryFn: () => retentionApi.storage(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function useRetentionActions() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: ["retention", activeId] });
  };
  return {
    sweep: useMutation({ mutationFn: () => retentionApi.sweep(activeId as string), onSuccess }),
    archive: useMutation({ mutationFn: () => retentionApi.archive(activeId as string), onSuccess }),
    purge: useMutation({ mutationFn: () => retentionApi.purge(activeId as string), onSuccess }),
  };
}
