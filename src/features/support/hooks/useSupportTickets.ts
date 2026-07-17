import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { supportApi } from "../api/support.api";
import { supportKeys } from "../api/support.keys";
import type { SupportTicketFilters } from "../api/support.types";

/** "My tickets" — the caller's own support ticket history for the active org. */
export function useSupportTickets(filters: SupportTicketFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: supportKeys.list(activeId ?? "none", filters),
    queryFn: () => supportApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
