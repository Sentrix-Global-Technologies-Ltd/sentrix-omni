import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { incidentsApi } from "../api/incidents.api";
import { incidentKeys } from "../api/incidents.keys";

/** Incident detail aggregate (incident + active assignment + timeline). */
export function useIncident(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: incidentKeys.detail(activeId ?? "none", id),
    queryFn: () => incidentsApi.detail(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
