import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { auditApi } from "../api/audit.api";
import { auditKeys } from "../api/audit.keys";
import type { AuditFilters } from "../api/audit.types";

/** Paginated audit log for the active organization, filtered by action. */
export function useAuditLogs(filters: AuditFilters) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: auditKeys.list(activeId ?? "none", filters),
    queryFn: () => auditApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
