import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { evidenceApi } from "../api/evidence.api";
import { evidenceKeys } from "../api/evidence.keys";
import type { EvidenceFilters } from "../api/evidence.types";

/** Paginated observation search for the active org. */
export function useEvidenceSearch(filters: EvidenceFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: evidenceKeys.search(activeId ?? "none", filters),
    queryFn: () => evidenceApi.search(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

/** Evidence vault stats for the active org. */
export function useEvidenceStats() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: evidenceKeys.stats(activeId ?? "none"),
    queryFn: () => evidenceApi.stats(activeId as string),
    enabled: Boolean(activeId),
  });
}
