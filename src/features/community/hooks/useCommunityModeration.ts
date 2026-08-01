import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";

/** Removes an alert from the active feed regardless of source (community/official/AI). */
export function useResolveCommunityAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communityApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "community-alerts"] });
    },
  });
}

/** Removes any comment on an alert's thread, regardless of author. */
export function useDeleteCommunityComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, commentId }: { alertId: string; commentId: string }) =>
      communityApi.deleteComment(alertId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "community-alerts", "comments", variables.alertId] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "community-alerts", "list"] });
    },
  });
}
