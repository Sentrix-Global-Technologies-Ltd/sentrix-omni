import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { respondersApi } from "../api/responders.api";
import { responderKeys } from "../api/responders.keys";

/** Responder status transition (server-confirmed; invalidate on success). */
export function useResponderActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const onSuccess = () => {
    if (activeId) {
      queryClient.invalidateQueries({ queryKey: responderKeys.all(activeId) });
    }
  };

  return {
    changeStatus: useMutation({
      mutationFn: (status: string) =>
        respondersApi.changeStatus(activeId as string, id, status),
      onSuccess,
    }),
  };
}
