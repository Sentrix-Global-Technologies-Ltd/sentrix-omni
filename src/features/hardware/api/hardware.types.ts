/** Hardware (device fleet) types — mirror the backend DeviceResource. */

export interface Device {
  id: string;
  organization_id: string;
  registered_by: string | null;
  kind: string;
  serial: string;
  name: string | null;
  site: string | null;
  zone: string | null;
  status: string;
  last_seen_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface DeviceFilters {
  status?: string;
  kind?: string;
  page?: number;
}
