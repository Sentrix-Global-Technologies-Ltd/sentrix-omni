/** Responder domain types — mirror the backend resources (read surface). */

export type ResponderStatus =
  | "off_duty"
  | "available"
  | "unavailable"
  | "engaged"
  | "suspended";

export interface ResponderIncidentRef {
  id: string;
  title: string;
  status: string;
  severity: string;
}

/** A responder's participation in an assignment (line), with incident summary. */
export interface ResponderAssignment {
  id: string;
  assignment_id: string;
  incident_id: string | null;
  role: string;
  status: string;
  attempt: number;
  offered_at: string | null;
  accepted_at: string | null;
  en_route_at: string | null;
  on_scene_at: string | null;
  completed_at: string | null;
  released_at: string | null;
  decline_reason: string | null;
  outcome: string | null;
  created_at: string | null;
  incident?: ResponderIncidentRef | null;
}

export interface Responder {
  id: string;
  organization_id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  status: ResponderStatus;
  on_duty: boolean;
  assignable: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_seen_at: string | null;
  current_assignment_id: string | null;
  current_assignment: ResponderAssignment | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ResponderFilters {
  status?: string;
  /** "1" to show only assignable responders. */
  assignable?: string;
  page?: number;
  /** Override the default page size (server caps at 100). */
  perPage?: number;
}

/** A member of the active organization, for the "register responder" picker. */
export interface OrgMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
}
