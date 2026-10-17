/** Assignment (dispatch) domain types — mirror the backend resources. */

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
  primary_assignment_responder_id: string | null;
  escalation_level: number;
  acceptance_deadline_at: string | null;
  opened_by: string | null;
  /** Only present on the detail endpoint (omitted from the list). */
  responders?: AssignmentResponderLine[];
  created_at: string | null;
  updated_at: string | null;
}

export interface AssignmentFilters {
  status?: string;
  incident_id?: string;
  page?: number;
  per_page?: number;
}

/** `POST assignments` payload (mirrors OpenAssignmentRequest). */
export interface CreateAssignmentInput {
  incident_id: string;
  dispatch_mode?: "manual" | "auto";
  required_supporting?: number;
}

/** One ranked candidate from `GET assignments/{id}/recommendations` (mirrors DispatchRecommender::rank()). */
export interface ResponderRecommendation {
  responder_id: string;
  user_id: string;
  score: number;
  distance_meters: number | null;
  reasons: string[];
}

export interface AssignmentRecommendations {
  has_coordinates: boolean;
  candidates: ResponderRecommendation[];
}
