import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { facilityApi } from "../api/facility.api";
import { facilityKeys } from "../api/facility.keys";
import type { CreateBuildingPayload, CreateZonePayload, UpdateBuildingPayload } from "../api/facility.types";

const POLL_MS = 15000;

function requireActiveOrganization(activeId: string | null): string {
  if (activeId === null) {
    throw new Error("No organization is selected. Switch to an organization first.");
  }
  return activeId;
}

export function useFacilityMap() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: facilityKeys.map(activeId ?? "none"),
    queryFn: () => facilityApi.map(activeId as string),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_MS,
  });
}

export function useFacilityActions() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const invalidate = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: facilityKeys.all(activeId) });
  };

  return {
    createBuilding: useMutation({
      mutationFn: (payload: CreateBuildingPayload) => facilityApi.createBuilding(requireActiveOrganization(activeId), payload),
      onSuccess: invalidate,
    }),
    updateBuilding: useMutation({
      mutationFn: ({ buildingId, payload }: { buildingId: string; payload: UpdateBuildingPayload }) =>
        facilityApi.updateBuilding(requireActiveOrganization(activeId), buildingId, payload),
      onSuccess: invalidate,
    }),
    deleteBuilding: useMutation({
      mutationFn: (buildingId: string) => facilityApi.deleteBuilding(requireActiveOrganization(activeId), buildingId),
      onSuccess: invalidate,
    }),
    createZone: useMutation({
      mutationFn: ({ buildingId, payload }: { buildingId: string; payload: CreateZonePayload }) =>
        facilityApi.createZone(requireActiveOrganization(activeId), buildingId, payload),
      onSuccess: invalidate,
    }),
    deleteZone: useMutation({
      mutationFn: ({ buildingId, zoneId }: { buildingId: string; zoneId: string }) =>
        facilityApi.deleteZone(requireActiveOrganization(activeId), buildingId, zoneId),
      onSuccess: invalidate,
    }),
  };
}
