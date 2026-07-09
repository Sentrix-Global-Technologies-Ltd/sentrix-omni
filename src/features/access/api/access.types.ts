/** Access control types — visitor passes + gate events (mirror backend resources). */

export interface Pass {
  id: string;
  organization_id: string;
  host_id: string | null;
  code: string;
  visitor_name: string | null;
  type: string;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  uses_count: number;
  revoked_at: string | null;
  created_at: string | null;
}

export interface GateEvent {
  id: string;
  organization_id: string;
  pass_id: string | null;
  officer_id: string | null;
  gate: string | null;
  direction: string;
  result: string;
  reason: string | null;
  visitor_name: string | null;
  recorded_at: string | null;
}

export interface PassFilters {
  status?: string;
  page?: number;
}

export interface GateFilters {
  result?: string;
  page?: number;
}
