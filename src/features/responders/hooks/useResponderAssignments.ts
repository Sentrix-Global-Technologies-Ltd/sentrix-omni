import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { respondersApi } from "../api/responders.api";
import { responderKeys } from "../api/responders.keys";

/** A responder's assignment participation (current + history). */
export function useResponderAssignments(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: responderKeys.assignments(activeId ?? "none", id),
    queryFn: () => respondersApi.assignments(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
