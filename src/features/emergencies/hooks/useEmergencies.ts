import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { emergenciesApi } from "../api/emergencies.api";
import { emergencyKeys } from "../api/emergencies.keys";
import type { EmergencyFilters } from "../api/emergencies.types";

/** Paginated emergency list for the active organization, filtered. */
export function useEmergencies(filters: EmergencyFilters) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: emergencyKeys.list(activeId ?? "none", filters),
    queryFn: () => emergenciesApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
