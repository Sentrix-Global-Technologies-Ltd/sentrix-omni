import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roadRiskApi } from "../api/road-risk.api";
import type { RoadSegmentPayload } from "../api/road-risk.api";

/** Create a new curated road segment. */
export function useCreateRoadSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoadSegmentPayload) => roadRiskApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "road-risk-segments"] });
    },
  });
}

/** Edit a segment's name/area/center/radius/active flag. */
export function useUpdateRoadSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RoadSegmentPayload> }) =>
      roadRiskApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "road-risk-segments"] });
    },
  });
}

/** Trigger an immediate rescore instead of waiting for the next scheduled sweep. */
export function useRecomputeRoadSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roadRiskApi.recompute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "road-risk-segments"] });
    },
  });
}
