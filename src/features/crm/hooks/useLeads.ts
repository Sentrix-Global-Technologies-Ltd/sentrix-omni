import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import { leadKeys } from "../api/leads.keys";
import type { LeadFilters } from "../api/leads.types";

/** Paginated CRM leads (platform/SuperAdmin), filtered. */
export function useLeads(filters: LeadFilters, enabled = true) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadsApi.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}
