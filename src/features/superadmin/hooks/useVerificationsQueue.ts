import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { verificationsQueueApi } from "../api/verifications.api";
import type { VerificationsQueueFilters } from "../api/verifications.types";

/** Cross-user KYC review queue (Sentrix Console). */
export function useVerificationsQueue(filters: VerificationsQueueFilters) {
  return useQuery({
    queryKey: ["superadmin", "verifications", "list", filters],
    queryFn: () => verificationsQueueApi.list(filters),
    placeholderData: keepPreviousData,
  });
}
