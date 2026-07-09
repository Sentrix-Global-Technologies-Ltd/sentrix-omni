import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { assignmentsApi } from "../api/assignments.api";
import { assignmentKeys } from "../api/assignments.keys";
import { incidentKeys } from "../../incidents/api/incidents.keys";
import type { AssignmentFilters, CreateAssignmentInput } from "../api/assignments.types";

/** Paginated assignment list for the active organization, filtered. */
export function useAssignments(filters: AssignmentFilters) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: assignmentKeys.list(activeId ?? "none", filters),
    queryFn: () => assignmentsApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

/**
 * Open a dispatch (assignment create). Invalidates both the assignment tree
 * and the incident tree, since an incident's detail aggregate embeds its
 * active assignment.
 */
export function useAssignmentMutations() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: (data: CreateAssignmentInput) => assignmentsApi.create(activeId as string, data),
      onSuccess: () => {
        if (activeId) {
          queryClient.invalidateQueries({ queryKey: assignmentKeys.all(activeId) });
          queryClient.invalidateQueries({ queryKey: incidentKeys.all(activeId) });
        }
      },
    }),
  };
}
