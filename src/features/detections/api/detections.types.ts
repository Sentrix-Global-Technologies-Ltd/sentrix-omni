/** Ingest detection types — mirror the backend DetectionEventResource. */

export type DetectionSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface DetectionEvent {
  id: string;
  organization_id: string;
  source: string;
  product: string | null;
  camera_source_id: string | null;
  type: string;
  severity: DetectionSeverity;
  risk_score: number;
  triggered: boolean;
  incident_id: string | null;
  site: string | null;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  summary: string | null;
  received_at: string | null;
  created_at: string | null;
}

/** Query parameters accepted by the organisation detections endpoint.
 * Mirrors OrganizationDetectionController::recent() filter contract. */
export interface DetectionFilters {
  /** Max records to return. Default 20, backend cap 50. */
  limit?: number;
  /** When true: only threshold-crossed events. When false: only suppressed.
   *  Omit to return both (default). */
  triggered?: boolean;
}
