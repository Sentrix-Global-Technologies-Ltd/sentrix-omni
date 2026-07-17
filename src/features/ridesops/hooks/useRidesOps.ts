import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ridesOpsApi } from "../api/ridesops.api";
import { ridesOpsKeys } from "../api/ridesops.keys";
import type { DriverFilters, RideFilters } from "../api/ridesops.types";

export function useRidesOverview(enabled = true) {
  return useQuery({
    queryKey: ridesOpsKeys.overview(),
    queryFn: () => ridesOpsApi.overview(),
    enabled,
  });
}

export function useOpsRides(filters: RideFilters) {
  return useQuery({
    queryKey: ridesOpsKeys.rides(filters),
    queryFn: () => ridesOpsApi.rides(filters),
    placeholderData: keepPreviousData,
  });
}

export function useOpsDrivers(filters: DriverFilters) {
  return useQuery({
    queryKey: ridesOpsKeys.drivers(filters),
    queryFn: () => ridesOpsApi.drivers(filters),
    placeholderData: keepPreviousData,
  });
}
