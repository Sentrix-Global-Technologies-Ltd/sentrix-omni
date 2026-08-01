import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { cameraFeedsApi } from "../api/camera-feeds.api";
import { cameraFeedKeys } from "../api/camera-feeds.keys";
import type { CreateCameraSourcePayload, UpdateCameraSourcePayload } from "../api/camera-feeds.types";

/** Same "no active org" guard as useSiteBridgeActions — a camera source
 * belongs to exactly one organization. */
function requireActiveOrganization(activeId: string | null): string {
  if (activeId === null) {
    throw new Error("No organization is selected. Switch to an organization first.");
  }
  return activeId;
}

/** Register a camera source directly (the "Add Camera Source" panel) — org-admin
 * write path, distinct from the Site Bridge auto-discovery flow. */
export function useCreateCameraSource() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCameraSourcePayload) =>
      cameraFeedsApi.create(requireActiveOrganization(activeId), payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: cameraFeedKeys.all(activeId) });
    },
  });
}

export function useUpdateCameraSource(sourceId: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCameraSourcePayload) =>
      cameraFeedsApi.update(requireActiveOrganization(activeId), sourceId, payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: cameraFeedKeys.all(activeId) });
    },
  });
}

export function useDeleteCameraSource() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => cameraFeedsApi.remove(requireActiveOrganization(activeId), sourceId),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: cameraFeedKeys.all(activeId) });
    },
  });
}
