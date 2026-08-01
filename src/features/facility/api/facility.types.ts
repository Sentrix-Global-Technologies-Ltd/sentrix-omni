/** Facility Map types — mirror BuildingResource / ZoneResource / FacilityMapController::index(). */

export type FeedStatus = "live" | "stale" | "offline" | "no_feed";

export interface FacilityCameraPin {
  id: string;
  label: string;
  type: string;
  feed_status: FeedStatus;
}

export interface FacilityZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cameras_total: number;
  cameras_online: number;
  cameras: FacilityCameraPin[];
}

export interface FacilityBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zones: FacilityZone[];
  unzoned_cameras_total: number;
  created_at: string | null;
}

export interface RecentZoneEvent {
  id: string;
  type: string | null;
  summary: string | null;
  severity: "critical" | "high" | "medium" | "low" | "info";
  risk_score: number;
  site: string | null;
  zone: string | null;
  triggered: boolean;
  received_at: string;
}

export interface FacilityMap {
  buildings: FacilityBuilding[];
  recent_events: RecentZoneEvent[];
}

export interface CreateBuildingPayload {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type UpdateBuildingPayload = Partial<CreateBuildingPayload>;

export interface CreateZonePayload {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
