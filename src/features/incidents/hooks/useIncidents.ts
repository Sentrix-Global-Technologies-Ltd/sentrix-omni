import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { incidentsApi } from "../api/incidents.api";
import { incidentKeys } from "../api/incidents.keys";
import type { IncidentFilters } from "../api/incidents.types";

/** Paginated incident list for the active organization, filtered. */
export function useIncidents(filters: IncidentFilters) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: incidentKeys.list(activeId ?? "none", filters),
    queryFn: () => incidentsApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
