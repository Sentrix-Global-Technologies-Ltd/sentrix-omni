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
