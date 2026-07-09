import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { intelApi } from "../api/intel.api";
import { intelKeys } from "../api/intel.keys";
import type { IntelRange } from "../api/intel.types";

export function useIntelReport(range: IntelRange) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: intelKeys.report(activeId ?? "none", range),
    queryFn: () => intelApi.report(activeId as string, range),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

export function useIntelAnalytics(range: IntelRange, bucket: string) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: intelKeys.analytics(activeId ?? "none", range, bucket),
    queryFn: () => intelApi.analytics(activeId as string, range, bucket),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

/** CSV export of the intel report. A mutation since it's a user-triggered download. */
export function useIntelExport() {
  const { activeId } = useOrganization();
  return useMutation({
    mutationFn: (range: IntelRange) => intelApi.exportCsv(activeId as string, range),
  });
}
