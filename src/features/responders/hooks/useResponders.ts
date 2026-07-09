import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { respondersApi } from "../api/responders.api";
import { responderKeys } from "../api/responders.keys";
import type { ResponderFilters } from "../api/responders.types";

/** Paginated responder roster for the active organization, filtered. */
export function useResponders(filters: ResponderFilters) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: responderKeys.list(activeId ?? "none", filters),
    queryFn: () => respondersApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
