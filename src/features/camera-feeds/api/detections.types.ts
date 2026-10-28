/**
 * Types for the Sentrix detection-events API.
 *
 * Endpoint: GET /api/v1/organizations/{org}/detections/recent
 * Auth:     Bearer (sanctum) + organization.team + incidents.view permission
 * Source:   DetectionEventResource.php
 */

export type DetectionSeverity = "critical" | "high" | "medium" | "low" | "info";
export type DetectionSource = "detection" | "vision" | "signal";

/** Shape returned by DetectionEventResource.toArray(). */
export interface DetectionEvent {
  id: string;
  organization_id: string;
  /** Origin pipeline: device detection, vision provider, or SafeSignal. */
  source: DetectionSource;
  product: string | null;
  camera_source_id: string | null;
  /** Free-text label from the AI pipeline (e.g. "loitering", "weapon_detected"). */
  type: string;
  severity: DetectionSeverity;
  /** Integer 0–100 from the decision engine. */
  risk_score: number;
  /** Whether this event crossed the trigger threshold and opened/updated an incident. */
  triggered: boolean;
  incident_id: string | null;
  site: string | null;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  summary: string | null;
  /** ISO 8601 UTC — the moment the signal was received by Ingest. */
  received_at: string | null;
  created_at: string | null;
}

/** Parameters accepted by detectionsApi.recent() and useRecentDetections(). */
export interface RecentDetectionsFilters {
  /** Max records to return. Default 50, backend cap 50. */
  limit?: number;
  /** Restrict to a single registered camera source. Omit for org-wide. */
  cameraSourceId?: string | null;
  /**
   * Restrict to detection events associated with a specific incident.
   * Requires incidents.view and the incident to belong to the active org.
   * When supplied, the backend verifies access before scoping the query.
   */
  incidentId?: string | null;
}
