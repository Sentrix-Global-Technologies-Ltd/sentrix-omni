import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { emergenciesApi } from "../api/emergencies.api";
import { emergencyKeys } from "../api/emergencies.keys";

/** Captured SOS audio/video/photo for this emergency. */
export function useEmergencyEvidence(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: emergencyKeys.evidence(activeId ?? "none", id),
    queryFn: () => emergenciesApi.evidence(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
