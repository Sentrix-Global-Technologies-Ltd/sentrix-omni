/** Command & CAD types — mirror backend resources (platform/SuperAdmin). */

export interface CommandOverview {
  total: number;
  open: number;
  critical: number;
  on_scene: number;
  last_24h: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface CmdIncident {
  id: string;
  command_id: string | null;
  agency_id: string | null;
  category: string;
  severity: string;
  status: string;
  source_type: string;
  source_ref: string | null;
  summary: string | null;
  lat: number | null;
  lng: number | null;
  sla_dispatch_due_at: string | null;
  sla_onscene_due_at: string | null;
  opened_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface Agency {
  id: string;
  code: string;
  name: string;
  country: string | null;
  categories: string[] | null;
  hotline: string | null;
  color: string | null;
  logo_url: string | null;
  status: string;
  created_at: string | null;
}

export interface CommandNode {
  id: string;
  agency_id: string | null;
  parent_id: string | null;
  tier: string;
  name: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
}

export interface CmdIncidentFilters {
  status?: string;
  severity?: string;
  category?: string;
  page?: number;
}

export interface AgencyFilters {
  status?: string;
  page?: number;
}

export interface CommandNodeFilters {
  tier?: string;
  page?: number;
}

export interface Unit {
  id: string;
  command_id: string | null;
  agency_id: string | null;
  call_sign: string;
  kind: string;
  capabilities: string[];
  crew: number | null;
  lat: number | null;
  lng: number | null;
  area: string | null;
  status: string;
  assigned_incident_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** A candidate unit returned by `command/incidents/{id}/closest-units`. */
export interface ClosestUnit {
  unit: Unit;
  kind_match: boolean;
  distance_km: number;
  score: number;
}

export interface UnitFilters {
  command_id?: string;
  agency_id?: string;
  status?: string;
  page?: number;
}

/**
 * Read-only agency-oversight view of an organization — which command/agency
 * jurisdiction it falls under (auto-linked by region match) plus a rolled-up
 * activity count. No org member/role/record detail is exposed here.
 */
export interface OrganizationOversight {
  id: string;
  name: string;
  region: string | null;
  command_id: string | null;
  command_name: string | null;
  command_tier: string | null;
  agency_id: string | null;
  agency_name: string | null;
  open_incidents_count: number | null;
  active_emergencies_count: number | null;
  created_at: string | null;
}

export interface OrganizationOversightFilters {
  agency_id?: string;
  command_id?: string;
  page?: number;
}

export interface UnitDispatch {
  id: string;
  unit_id: string;
  command_incident_id: string;
  dispatched_by: string | null;
  dispatched_at: string | null;
  cleared_at: string | null;
  outcome: string | null;
  created_at: string | null;
}
