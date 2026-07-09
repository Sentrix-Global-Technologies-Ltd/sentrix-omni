import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { emergenciesApi } from "../api/emergencies.api";
import { emergencyKeys } from "../api/emergencies.keys";

/** Emergency detail. */
export function useEmergency(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: emergencyKeys.detail(activeId ?? "none", id),
    queryFn: () => emergenciesApi.detail(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
