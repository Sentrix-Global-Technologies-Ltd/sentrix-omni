/** Coordination types — mirror backend resources (platform/SuperAdmin). */

export interface MutualAidRequest {
  id: string;
  command_incident_id: string;
  requesting_command_id: string;
  responding_command_id: string;
  status: string;
  message: string | null;
  requested_by: string | null;
  responded_at: string | null;
  created_at: string | null;
}

export interface UnitMessage {
  id: string;
  unit_id: string;
  command_incident_id: string | null;
  direction: string;
  body: string;
  sender: string | null;
  read_at: string | null;
  created_at: string | null;
}

export interface Tasking {
  id: string;
  kind: string;
  ref: string | null;
  title: string;
  assignee: string | null;
  status: string;
  created_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface DutyEntry {
  id: string;
  scope_type: string;
  scope_id: string;
  person_name: string;
  role: string | null;
  action: string;
  recorded_at: string | null;
  created_at: string | null;
}

export interface CoordinationAnalytics {
  window_days: number;
  incidents: {
    total: number;
    open: number;
    resolved: number;
    by_category: Record<string, number>;
    by_severity: Record<string, number>;
    by_status: Record<string, number>;
  };
  response_time_seconds: {
    measured: number;
    average: number | null;
    median: number | null;
  };
  sla_dispatch: {
    considered: number;
    met: number;
    compliance_pct: number | null;
  };
  unit_utilization: {
    total: number;
    assigned: number;
    pct: number | null;
  };
}

export interface MutualAidFilters {
  status?: string;
  command_incident_id?: string;
  page?: number;
}

export interface TaskingFilters {
  status?: string;
  kind?: string;
  page?: number;
}

export interface DutyFilters {
  scope_type?: string;
  page?: number;
}

export interface ThreadFilters {
  page?: number;
}
