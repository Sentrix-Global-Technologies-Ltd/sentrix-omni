import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import { leadKeys } from "../api/leads.keys";

/** Lead detail. */
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsApi.detail(id),
    enabled: Boolean(id),
  });
}
