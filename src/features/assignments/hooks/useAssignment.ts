import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { assignmentsApi } from "../api/assignments.api";
import { assignmentKeys } from "../api/assignments.keys";

/** Assignment detail (with responder lines). */
export function useAssignment(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: assignmentKeys.detail(activeId ?? "none", id),
    queryFn: () => assignmentsApi.detail(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
