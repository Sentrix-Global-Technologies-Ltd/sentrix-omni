import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { facilityApi } from "../api/facility.api";
import { facilityKeys } from "../api/facility.keys";
import type { CreateBuildingPayload, CreateZonePayload, UpdateBuildingPayload, UpdateCameraPositionPayload, UpdateZonePayload } from "../api/facility.types";

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

/**
 * Fetches ALL org camera sources regardless of site/zone assignment.
 * Used by the Facility Map Unplaced Cameras panel so cameras that have no
 * site/zone (or whose site doesn't match any building name) still appear.
 * Polls at the same rate as the facility map so placed/unplaced status stays
 * in sync after a drag-to-place.
 */
export function useOrgCameraSources() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: facilityKeys.cameraSources(activeId ?? "none"),
    queryFn: () => facilityApi.listAllCameraSources(activeId as string),
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
    updateZone: useMutation({
      mutationFn: ({ buildingId, zoneId, payload }: { buildingId: string; zoneId: string; payload: UpdateZonePayload }) =>
        facilityApi.updateZone(requireActiveOrganization(activeId), buildingId, zoneId, payload),
      onSuccess: invalidate,
    }),
    deleteZone: useMutation({
      mutationFn: ({ buildingId, zoneId }: { buildingId: string; zoneId: string }) =>
        facilityApi.deleteZone(requireActiveOrganization(activeId), buildingId, zoneId),
      onSuccess: invalidate,
    }),
    placeCameraOnMap: useMutation({
      mutationFn: ({ cameraId, payload }: { cameraId: string; payload: UpdateCameraPositionPayload }) =>
        facilityApi.updateCameraPosition(requireActiveOrganization(activeId), cameraId, payload),
      onSuccess: invalidate,
    }),
  };
}
