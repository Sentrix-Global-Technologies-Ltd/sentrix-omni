/** Incident domain types — mirror the backend resources (read surface). */

export type IncidentStatus =
  | "open"
  | "investigating"
  | "escalated"
  | "resolved"
  | "closed";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  organization_id: string;
  emergency_id: string | null;
  opened_by: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  title: string;
  summary: string | null;
  /** Highest risk score among detections attributed to this incident (Ingest
   * pipeline). Only present when the backend eager-loaded detectionEvents
   * (incident list/detail views); undefined otherwise — null means it loaded
   * but there's no linked detection (a human-opened incident). */
  risk_score?: number | null;
  opened_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  /** Honest manual record — no automated authorities-dispatch integration
   * exists. Set when an operator/supervisor records that they personally
   * contacted external authorities (see incidents.notify_authorities). */
  authorities_notified_at: string | null;
  authorities_notified_by: string | null;
  authorities_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface TimelineEntry {
  at: string | null;
  type: string;
  source: string;
  /** Name of the user who performed the action; null for system-generated entries.
   *  Populated by the backend via an eager-loaded actor relationship.  */
  actor_name?: string | null;
  payload: Record<string, unknown>;
}

export type AssignmentStatus =
  | "pending"
  | "dispatching"
  | "partially_filled"
  | "filled"
  | "active"
  | "escalated"
  | "completed"
  | "cancelled";

export interface AssignmentResponderLine {
  id: string;
  assignment_id: string;
  organization_id: string;
  responder_id: string;
  responder_user_id: string | null;
  responder_name: string | null;
  responder_email: string | null;
  incident_id: string | null;
  role: string;
  status: string;
  attempt: number;
  assigned_by: string | null;
  offered_at: string | null;
  accepted_at: string | null;
  en_route_at: string | null;
  on_scene_at: string | null;
  completed_at: string | null;
  released_at: string | null;
  decline_reason: string | null;
  outcome: string | null;
  created_at: string | null;
}

export interface Assignment {
  id: string;
  organization_id: string;
  incident_id: string | null;
  status: AssignmentStatus;
  dispatch_mode: string | null;
  required_primary: number;
  required_supporting: number;
  escalation_level: number;
  acceptance_deadline_at: string | null;
  opened_by: string | null;
  responders: AssignmentResponderLine[];
  created_at: string | null;
  updated_at: string | null;
}

export interface IncidentExplanationCamera {
  id: string;
  label: string;
  site: string | null;
  zone: string | null;
}

export interface IncidentExplanationDetection {
  label: string | null;
  confidence: number | null;
}

export interface IncidentExplanationObserved {
  description: string | null;
  detections: IncidentExplanationDetection[];
  scene_risk: string | null;
}

/** Provider/model metadata for the AI frame analysis — from DetectionExplanationResource::ANALYSIS_FIELDS. */
export interface IncidentExplanationAnalysis {
  provider: string | null;
  model: string | null;
  frame_hash: string | null;
  content_type: string | null;
  analyzed_at: string | null;
  latency_ms: number | null;
  attempts: number | null;
}

/** DecisionEngine assessment record — from DetectionExplanationResource::ASSESSMENT_FIELDS. */
export interface IncidentExplanationAssessment {
  basis_label: string | null;
  basis_confidence: number | null;
  confidence_factor: number | null;
  base_risk: number | null;
  risk_score: number | null;
  intrinsic_severity: string | null;
  banded_severity: string | null;
  severity: string | null;
  matched_rule: string | null;
  matched_term: string | null;
  trigger_threshold: number | null;
  triggered: boolean | null;
  reason: string | null;
}

export interface IncidentExplanation {
  detection_event_id: string;
  received_at: string | null;
  camera: IncidentExplanationCamera | null;
  /** Scene description and per-detection labels — from DetectionExplanationResource. */
  observed: IncidentExplanationObserved | null;
  /** Provider/model metadata for the AI analysis call. */
  analysis: IncidentExplanationAnalysis | null;
  /** DecisionEngine assessment that determined this detection was actionable. */
  assessment: IncidentExplanationAssessment | null;
}

/** `GET incidents/{id}` aggregate. */
export interface IncidentDetail {
  incident: Incident;
  assignment: Assignment | null;
  timeline: TimelineEntry[];
  explanation: IncidentExplanation | null;
}

export interface IncidentFilters {
  status?: string;
  severity?: string;
  page?: number;
}

/** `POST incidents` payload (mirrors OpenIncidentRequest). */
export interface CreateIncidentInput {
  title: string;
  severity?: IncidentSeverity;
  summary?: string;
  emergency_id?: string;
  assigned_to?: string;
}

/** `PATCH incidents/{id}` payload (mirrors UpdateIncidentRequest). */
export interface UpdateIncidentInput {
  title?: string;
  severity?: IncidentSeverity;
  summary?: string;
  assigned_to?: string | null;
}

/** Extended filter set used by the Incidents Centre list page.
 *  Adds per_page so KPI count queries can request page=1&per_page=1
 *  to retrieve meta.total cheaply without loading all records. */
export interface IncidentCentreFilters extends IncidentFilters {
  per_page?: number;
}
