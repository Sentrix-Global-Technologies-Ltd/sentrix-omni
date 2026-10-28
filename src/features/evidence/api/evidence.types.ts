/** Evidence vault types — mirror the backend ObservationResource (org-scoped). */

export interface Observation {
  id: string;
  organization_id: string;
  camera_source_id: string | null;
  kind: string;
  label: string | null;
  attributes: Record<string, unknown> | null;
  plate: string | null;
  confidence: number | null;
  severity: string | null;
  snapshot_url: string | null;
  clip_url: string | null;
  lat: number | null;
  lng: number | null;
  observed_at: string | null;
  hold: boolean;
  bookmarked: boolean;
  sealed: boolean;
  retention_tier: string;
  created_at: string | null;
}

export interface EvidenceStats {
  total: number;
  by_kind: Record<string, number>;
  by_retention_tier: Record<string, number>;
  on_legal_hold: number;
  bookmarked: number;
  awaiting_review: number;
}

export interface EvidenceFilters {
  kind?: string;
  severity?: string;
  status?: string;
  plate?: string;
  q?: string;
  /** Cursor (keyset) pagination token. */
  cursor?: string;
  /** Records per page — passed as per_page to the API (backend default 15, max 100). */
  per_page?: number;
  // --- Batch 2: backend-supported filters not previously wired ---
  /** UUID of the camera source to filter by. Backend guards non-UUID input. */
  camera_source_id?: string;
  /**
   * Inclusive start of the observed_at range (ISO date, e.g. "2024-01-01").
   * Sent to the backend as-is; Carbon::parse() handles the date string.
   */
  from?: string;
  /**
   * Inclusive end of the observed_at range (ISO date, e.g. "2024-01-31").
   * Stored as a plain date; evidenceApi.search() appends T23:59:59 before
   * sending so that Carbon::parse() on the backend resolves to end-of-day
   * rather than midnight, ensuring the full day is included.
   */
  to?: string;
  /** JSONB attribute facet — vehicle/object colour substring match. */
  color?: string;
  /** JSONB attribute facet — vehicle make substring match. */
  make?: string;
  /** JSONB attribute facet — vehicle model substring match. */
  model?: string;
  /** JSONB attribute facet — generic item label substring match. */
  item?: string;
}

/** A user-curated case-file grouping of existing Observations. Membership
 * never mutates an observation's hold/seal/retention_tier — see the backend
 * EvidenceCollectionService docblock. */
export interface EvidenceCollection {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  creator_name?: string | null;
  /** Present on index()/show() (withCount), absent elsewhere. */
  observations_count?: number;
  /** Present only on show() and after an add/remove mutation. */
  observations?: Observation[];
  created_at: string | null;
  updated_at: string | null;
}
