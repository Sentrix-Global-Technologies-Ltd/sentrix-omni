import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { auditApi } from "../api/audit.api";
import { auditKeys } from "../api/audit.keys";
import type { AuditFilters } from "../api/audit.types";

/**
 * Paginated audit log for the active organization, filtered by action and/or
 * subject (subject_type + subject_id together scope this to one record's
 * chain-of-custody trail — see CustodyModal). A subject_type without its id
 * is an incomplete filter, so the query stays disabled until both are set.
 */
export function useAuditLogs(filters: AuditFilters) {
  const { activeId } = useOrganization();
  const hasCompleteSubjectFilter = !filters.subject_type || Boolean(filters.subject_id);

  return useQuery({
    queryKey: auditKeys.list(activeId ?? "none", filters),
    queryFn: () => auditApi.list(activeId as string, filters),
    enabled: Boolean(activeId) && hasCompleteSubjectFilter,
    placeholderData: keepPreviousData,
  });
}
