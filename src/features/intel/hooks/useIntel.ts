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

/** Command Center KPI tile: rolling 24h vs. prior-24h avg time-to-dispatch.
 * Polled at the same cadence as the backend's cache TTL (30s) since there's
 * no single realtime event that maps to "this rolling aggregate changed". */
export function useIntelDispatchTrend() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: intelKeys.dispatchTrend(activeId ?? "none"),
    queryFn: () => intelApi.dispatchTrend(activeId as string),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
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

/** AI Analytics headline gauge. Polled at the backend's own cache TTL (30s) —
 * same rationale as useIntelDispatchTrend: no single realtime event maps to
 * "this rolling aggregate changed". */
export function useThreatScore() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: intelKeys.threatScore(activeId ?? "none"),
    queryFn: () => intelApi.threatScore(activeId as string),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });
}

/** Persisted Threat Score history (hourly snapshots) for the trend chart. */
export function useThreatScoreHistory(hours = 24 * 7) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: intelKeys.threatScoreHistory(activeId ?? "none", hours),
    queryFn: () => intelApi.threatScoreHistory(activeId as string, hours),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}
