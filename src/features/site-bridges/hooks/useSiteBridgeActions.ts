import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { siteBridgesApi } from "../api/site-bridges.api";
import { siteBridgeKeys } from "../api/site-bridges.keys";

/** Onboard a new Site Bridge (returns a one-time bridge key). */
export function useOnboardBridge() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { label: string }) => siteBridgesApi.onboard(activeId as string, payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: siteBridgeKeys.all(activeId) });
    },
  });
}

/** Bridge lifecycle actions (SuperAdmin/OrganizationAdmin-gated, bridges.manage). */
export function useSiteBridgeActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: siteBridgeKeys.all(activeId) });
  };

  return {
    activate: useMutation({ mutationFn: () => siteBridgesApi.activate(activeId as string, id), onSuccess }),
    suspend: useMutation({ mutationFn: () => siteBridgesApi.suspend(activeId as string, id), onSuccess }),
    revoke: useMutation({ mutationFn: () => siteBridgesApi.revoke(activeId as string, id), onSuccess }),
    rotateKey: useMutation({ mutationFn: () => siteBridgesApi.rotateKey(activeId as string, id), onSuccess }),
  };
}
