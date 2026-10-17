import { useQueries } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { incidentsApi } from "../api/incidents.api";
import { incidentKeys } from "../api/incidents.keys";

/**
 * Five parallel lightweight queries — each requests per_page=1 so the backend
 * returns only meta.total (current page count is irrelevant). This avoids a
 * dedicated aggregate endpoint while keeping KPI counts accurate.
 *
 * KPI buckets:
 *  - total:       all incidents (no filter)
 *  - open:        status=open
 *  - escalated:   status=escalated
 *  - critical:    severity=critical
 *  - resolved:    status=resolved
 *
 * NOTE: "False Positives" does not exist as a backend status — the 5th slot
 * shows Resolved counts instead.
 */

interface KpiResult {
  total: number | null;
  open: number | null;
  escalated: number | null;
  critical: number | null;
  resolved: number | null;
  /** True when every query has settled (success or error — not loading). */
  settled: boolean;
}

interface PaginatorMeta {
  total?: number;
}

function extractTotal(data: { meta?: PaginatorMeta } | undefined): number | null {
  if (data?.meta?.total === undefined) return null;
  return data.meta.total;
}

export function useIncidentKpis(): KpiResult {
  const { activeId } = useOrganization();
  const orgId = activeId ?? "none";
  const enabled = Boolean(activeId);

  // Bucket definitions — status and severity are intentionally typed loosely
  // here because the queries only read meta.total, not the returned records.
  const buckets = [
    { key: "total",     filters: {} },
    { key: "open",      filters: { status: "open" } },
    { key: "escalated", filters: { status: "escalated" } },
    { key: "critical",  filters: { severity: "critical" } },
    { key: "resolved",  filters: { status: "resolved" } },
  ] as const;

  const results = useQueries({
    queries: buckets.map((bucket) => ({
      // Use a distinct query key per bucket so each caches independently.
      queryKey: [...incidentKeys.list(orgId, bucket.filters), "kpi"] as const,
      queryFn: () =>
        incidentsApi.list(orgId, {
          ...bucket.filters,
          page: 1,
          per_page: 1,
        }),
      enabled,
      // KPI counts are moderately stale-tolerant — 30 s refresh is fine.
      staleTime: 30_000,
    })),
  });

  const [totalQ, openQ, escalatedQ, criticalQ, resolvedQ] = results;
  const settled = results.every((r) => !r.isPending);

  return {
    total:     extractTotal(totalQ.data ?? undefined),
    open:      extractTotal(openQ.data ?? undefined),
    escalated: extractTotal(escalatedQ.data ?? undefined),
    critical:  extractTotal(criticalQ.data ?? undefined),
    resolved:  extractTotal(resolvedQ.data ?? undefined),
    settled,
  };
}
