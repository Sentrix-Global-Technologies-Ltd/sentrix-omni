import type { IntelRange } from "./intel.types";

/** Intel is organization-scoped — keys carry the active org id. */
export const intelKeys = {
  all: (orgId: string) => ["intel", orgId] as const,
  report: (orgId: string, range: IntelRange) => ["intel", orgId, "report", range] as const,
  analytics: (orgId: string, range: IntelRange, bucket: string) =>
    ["intel", orgId, "analytics", range, bucket] as const,
  dispatchTrend: (orgId: string) => ["intel", orgId, "dispatch-trend"] as const,
  threatScore: (orgId: string) => ["intel", orgId, "threat-score"] as const,
  threatScoreHistory: (orgId: string, hours: number) =>
    ["intel", orgId, "threat-score-history", hours] as const,
};
