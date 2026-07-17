import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface OutcomeKindStats {
  samples: number;
  resolved: number;
  rate: number | null;
}

export interface OutcomeStats {
  by_kind: Record<string, OutcomeKindStats>;
}

/** Outcome tracking (item 20) — the org's recorded response-outcome rates,
 * durably written by SentrixCore's `record_outcome` tool. */
export const outcomesApi = {
  stats(organizationId: string): Promise<ApiResult<OutcomeStats>> {
    return apiClient.get<OutcomeStats>(`organizations/${organizationId}/core/outcome-stats`);
  },
};
