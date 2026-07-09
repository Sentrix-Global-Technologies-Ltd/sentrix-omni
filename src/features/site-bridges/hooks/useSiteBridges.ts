import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { siteBridgesApi } from "../api/site-bridges.api";
import { siteBridgeKeys } from "../api/site-bridges.keys";
import type { BridgeFilters } from "../api/site-bridges.types";

export function useSiteBridges(filters: BridgeFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: siteBridgeKeys.list(activeId ?? "none", filters),
    queryFn: () => siteBridgesApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
