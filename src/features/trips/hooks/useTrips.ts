import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { tripsApi } from "../api/trips.api";
import { tripKeys } from "../api/trips.keys";
import type { CreateTripInput, TripFilters, UpdateTripInput } from "../api/trips.types";

export function useTrips(filters: TripFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: tripKeys.list(activeId ?? "none", filters),
    queryFn: () => tripsApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

export function useTrip(id: string) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: tripKeys.detail(activeId ?? "none", id),
    queryFn: () => tripsApi.detail(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}

export function useTripActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: tripKeys.all(activeId) });
  };
  return {
    complete: useMutation({ mutationFn: () => tripsApi.complete(activeId as string, id), onSuccess }),
    cancel: useMutation({ mutationFn: () => tripsApi.cancel(activeId as string, id), onSuccess }),
    update: useMutation({
      mutationFn: (data: UpdateTripInput) => tripsApi.update(activeId as string, id, data),
      onSuccess,
    }),
  };
}

/**
 * Trip create (list-scoped — no id). Invalidates the trip query tree on success
 * so the new trip appears in the list.
 */
export function useTripMutations() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: (data: CreateTripInput) => tripsApi.create(activeId as string, data),
      onSuccess: () => {
        if (activeId) {
          queryClient.invalidateQueries({ queryKey: tripKeys.all(activeId) });
        }
      },
    }),
  };
}
