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
