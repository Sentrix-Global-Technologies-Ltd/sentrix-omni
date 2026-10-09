/** Emergency domain types — mirror the backend resource (read surface). */

export type EmergencyStatus =
  | "triggered"
  | "acknowledged"
  | "resolved"
  | "cancelled";

export type EmergencySeverity = "low" | "medium" | "high" | "critical";

export interface Emergency {
  id: string;
  organization_id: string;
  user_id: string;
  trip_id: string | null;
  status: EmergencyStatus;
  severity: EmergencySeverity;
  message: string | null;
  location: { lat: number | null; lng: number | null };
  triggered_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface EmergencyFilters {
  status?: string;
  severity?: string;
  page?: number;
}

export type EmergencyEvidenceKind = "audio" | "video" | "photo" | "screenshot";

/** Mirrors EmergencyEvidenceResource — audio/video/photo captured during a
 *  consumer's SOS. Previously only ever readable by the consumer themselves
 *  (me/emergencies/{id}/evidence); see emergenciesApi.evidence(). */
export interface EmergencyEvidence {
  id: string;
  emergency_id: string;
  kind: EmergencyEvidenceKind;
  url: string;
  content_type: string | null;
  size_bytes: number | null;
  duration_s: number | null;
  created_at: string | null;
}
