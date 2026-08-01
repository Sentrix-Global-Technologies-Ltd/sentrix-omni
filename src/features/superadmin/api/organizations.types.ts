/** Platform organization directory types — mirror the backend
 *  PlatformOrganizationResource (Sentrix Console, organizations.view). */

export interface PlatformOrganizationSummary {
  id: string;
  name: string;
  email: string;
}

export interface PlatformOrganizationCommand {
  id: string;
  name: string;
  area: string | null;
  agency_id: string;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  members_count?: number;
  devices_count?: number;
  camera_sources_count?: number;
  camera_sources_online_count?: number;
  open_incidents_count?: number;
  active_emergencies_count?: number;
  subscription_plan_key: string | null;
  subscription_status: string | null;
  owner?: PlatformOrganizationSummary | null;
  command?: PlatformOrganizationCommand | null;
  created_at: string | null;
}

export interface PlatformOrganizationFilters {
  q?: string;
  region?: string;
  page?: number;
  per_page?: number;
}
