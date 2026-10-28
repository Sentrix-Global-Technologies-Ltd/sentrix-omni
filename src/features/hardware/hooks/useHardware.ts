import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { hardwareApi } from "../api/hardware.api";
import { hardwareKeys } from "../api/hardware.keys";
import type { DeviceFilters, TransitionDeviceStatusPayload } from "../api/hardware.types";

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

/** Guard: a Device belongs to one organization. */
function requireActiveOrganization(activeId: string | null): string {
  if (activeId === null) {
    throw new Error("No organization is selected. Switch to an organization first.");
  }
  return activeId;
}

/** Register a new hardware device (hardware.register permission required). */
export function useRegisterDevice() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: import("../api/hardware.types").RegisterDevicePayload) =>
      hardwareApi.create(requireActiveOrganization(activeId), payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: hardwareKeys.all(activeId) });
    },
  });
}

/** Transition a device's lifecycle status (hardware.manage permission required). */
export function useTransitionDeviceStatus(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransitionDeviceStatusPayload) =>
      hardwareApi.transition(requireActiveOrganization(activeId), id, payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: hardwareKeys.all(activeId) });
    },
  });
}
