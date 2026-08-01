import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { roadRiskApi } from "../api/road-risk.api";
import type { RoadRiskSegmentFilters } from "../api/road-risk.api";

export function useRoadRiskSegments(filters: RoadRiskSegmentFilters) {
  return useQuery({
    queryKey: ["superadmin", "road-risk-segments", "list", filters],
    queryFn: () => roadRiskApi.list(filters),
    placeholderData: keepPreviousData,
  });
}
