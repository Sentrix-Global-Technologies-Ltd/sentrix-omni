import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { hardwareApi } from "../api/hardware.api";
import { hardwareKeys } from "../api/hardware.keys";
import type { DeviceFilters } from "../api/hardware.types";

export function useDevices(filters: DeviceFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: hardwareKeys.list(activeId ?? "none", filters),
    queryFn: () => hardwareApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

/** Device maintenance actions (resync / diagnose). */
export function useDeviceActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: hardwareKeys.all(activeId) });
  };
  return {
    resync: useMutation({ mutationFn: () => hardwareApi.resync(activeId as string, id), onSuccess }),
    diagnose: useMutation({ mutationFn: () => hardwareApi.diagnose(activeId as string, id), onSuccess }),
  };
}
