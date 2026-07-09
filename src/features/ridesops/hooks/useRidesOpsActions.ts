import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ridesOpsApi } from "../api/ridesops.api";
import { ridesOpsKeys } from "../api/ridesops.keys";

/** Ride write actions (SuperAdmin). Invalidate the rides-ops tree on success. */
export function useRideActions(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ridesOpsKeys.all() });

  return {
    cancel: useMutation({
      mutationFn: (reason?: string) => ridesOpsApi.cancelRide(id, reason),
      onSuccess,
    }),
    escalate: useMutation({
      mutationFn: (reason?: string) => ridesOpsApi.escalateRide(id, reason),
      onSuccess,
    }),
    reassign: useMutation({
      mutationFn: (driverName?: string) => ridesOpsApi.reassignRide(id, driverName),
      onSuccess,
    }),
  };
}

/** Surge pricing control (SuperAdmin). */
export function useSurgeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { multiplier?: number; zone?: string; note?: string; release?: boolean }) =>
      ridesOpsApi.setSurge(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ridesOpsKeys.all() }),
  });
}

/** Driver write actions (SuperAdmin). */
export function useDriverActions(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ridesOpsKeys.all() });

  return {
    suspend: useMutation({
      mutationFn: (reason?: string) => ridesOpsApi.suspendDriver(id, reason),
      onSuccess,
    }),
    reinstate: useMutation({
      mutationFn: () => ridesOpsApi.reinstateDriver(id),
      onSuccess,
    }),
  };
}
