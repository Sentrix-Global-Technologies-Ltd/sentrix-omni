import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supportQueueApi } from "../api/support-queue.api";
import type { SupportQueueFilters } from "../api/support-queue.api";

/** Cross-tenant support ticket queue (Sentrix Console). */
export function useSupportQueue(filters: SupportQueueFilters) {
  return useQuery({
    queryKey: ["superadmin", "support-tickets", "list", filters],
    queryFn: () => supportQueueApi.list(filters),
    placeholderData: keepPreviousData,
  });
}
