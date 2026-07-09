import { apiClient } from "../../../services/api/client";
import { downloadFile } from "../../../services/api/download";
import type { ApiResult } from "../../../services/api/types";
import type { IntelAnalytics, IntelRange, IntelReport } from "./intel.types";

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

  /** Download the intel report for the range as a CSV (streamed by the backend). */
  exportCsv(orgId: string, range: IntelRange): Promise<void> {
    return downloadFile(`${base(orgId)}/reports/export`, {
      query: { range, format: "csv" },
      organizationId: orgId,
    });
  },
};
