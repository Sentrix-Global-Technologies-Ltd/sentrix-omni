/** Retention types — mirror the backend StorageUsage DTO / RetentionExportResource. */

export interface RetentionPolicyWindows {
  hot_days: number;
  warm_days: number;
  cold_days: number;
  evidence_days: number;
}

export interface StorageUsage {
  plan: string;
  quota_gb: number;
  counts_by_tier: Record<string, number>;
  total: number;
  on_legal_hold: number;
  archived: number;
  estimated_bytes: number;
  pct_of_quota: number;
  policy: RetentionPolicyWindows;
}

/** One archive-first export manifest (append-only — see RetentionExport). */
export interface RetentionExport {
  id: string;
  organization_id: string;
  exported_by: string | null;
  format: string;
  count: number;
  manifest: Array<{
    id: string;
    kind: string;
    plate: string | null;
    observed_at: string | null;
    snapshot_url: string | null;
    clip_url: string | null;
  }>;
  created_at: string | null;
}
