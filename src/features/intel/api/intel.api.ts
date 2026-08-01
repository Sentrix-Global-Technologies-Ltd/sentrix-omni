import { apiClient } from "../../../services/api/client";
import { downloadFile } from "../../../services/api/download";
import type { ApiResult } from "../../../services/api/types";
import type {
  IntelAnalytics,
  IntelDispatchTrend,
  IntelRange,
  IntelReport,
  ThreatScore,
  ThreatScoreSnapshot,
} from "./intel.types";

const base = (orgId: string) => `organizations/${orgId}/intel`;

/** Intel endpoints (org-scoped, read-only). */
export const intelApi = {
  report(orgId: string, range: IntelRange): Promise<ApiResult<IntelReport>> {
    return apiClient.get<IntelReport>(`${base(orgId)}/reports`, { query: { range } });
  },

  analytics(
    orgId: string,
    range: IntelRange,
    bucket: string,
  ): Promise<ApiResult<IntelAnalytics>> {
    return apiClient.get<IntelAnalytics>(`${base(orgId)}/analytics`, {
      query: { range, bucket },
    });
  },

  /** Rolling 24h vs. prior-24h avg time-to-dispatch — Command Center KPI tile. */
  dispatchTrend(orgId: string): Promise<ApiResult<IntelDispatchTrend>> {
    return apiClient.get<IntelDispatchTrend>(`${base(orgId)}/dispatch-trend`);
  },

  /** Download the intel report for the range as a CSV (streamed by the backend). */
  exportCsv(orgId: string, range: IntelRange): Promise<void> {
    return downloadFile(`${base(orgId)}/reports/export`, {
      query: { range, format: "csv" },
      organizationId: orgId,
    });
  },

  /** AI Analytics headline gauge + contributing factors — see ThreatScoreService. */
  threatScore(orgId: string): Promise<ApiResult<ThreatScore>> {
    return apiClient.get<ThreatScore>(`${base(orgId)}/threat-score`);
  },

  /** Persisted hourly Threat Score history for the AI Analytics trend chart. */
  threatScoreHistory(orgId: string, hours = 24 * 7): Promise<ApiResult<ThreatScoreSnapshot[]>> {
    return apiClient.get<ThreatScoreSnapshot[]>(`${base(orgId)}/threat-score/history`, {
      query: { hours },
    });
  },
};
