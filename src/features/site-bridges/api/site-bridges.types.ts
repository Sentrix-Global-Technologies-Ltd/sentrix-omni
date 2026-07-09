/** Site Bridge types — mirror the backend CameraBridgeResource. */

export interface CameraBridge {
  id: string;
  organization_id: string;
  label: string;
  status: string;
  health: string;
  last_seen_at: string | null;
  created_at: string | null;
}

export interface BridgeFilters {
  status?: string;
  page?: number;
}
