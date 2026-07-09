/** Sentrix Ledger types — mirror the backend resources (platform/SuperAdmin). */

export interface LedgerSource {
  id: string;
  slug: string;
  name: string;
  product: string | null;
  kind: string;
  organization_id: string | null;
  status: string;
  key_fingerprint: string | null;
  last_write_at: string | null;
  write_count: number;
  stale_alerted: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface LedgerWrite {
  id: string;
  ledger_source_id: string;
  type: string;
  summary: string | null;
  ref: string | null;
  organization_id: string | null;
  recorded_at: string | null;
  created_at: string | null;
}

export interface LedgerStats {
  total_writes: number;
  active_sources: number;
  source_count: number;
  sources: Array<{
    id: string;
    slug: string;
    name: string;
    product: string | null;
    kind: string;
    status: string;
    write_count: number;
    last_write_at: string | null;
    health: string;
  }>;
}

export interface SourceFilters {
  status?: string;
  page?: number;
}

export interface WriteFilters {
  type?: string;
  page?: number;
}
