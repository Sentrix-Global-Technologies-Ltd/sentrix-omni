import { useMutation } from "@tanstack/react-query";
import { verificationsQueueApi } from "../api/verifications.api";

/**
 * "Reveal on click" for a KYC submission's full ID number — an explicit
 * staff action (never auto-fetched alongside the modal), matching
 * useDecideVerification's shape. No cache invalidation needed: this doesn't
 * change server state, just returns something sensitive on demand.
 */
export function useRevealIdNumber() {
  return useMutation({
    mutationFn: (id: string) => verificationsQueueApi.revealIdNumber(id),
  });
}
