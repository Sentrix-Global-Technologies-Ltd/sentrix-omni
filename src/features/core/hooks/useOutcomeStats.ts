import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { outcomesApi } from "../api/outcomes.api";

/** Item 20 — the org's recorded response-outcome resolution rates. */
export function useOutcomeStats() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["core", "outcome-stats", activeId ?? "none"],
    queryFn: () => outcomesApi.stats(activeId as string),
    enabled: Boolean(activeId),
  });
}
