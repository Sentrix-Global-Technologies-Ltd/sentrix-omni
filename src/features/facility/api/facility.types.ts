/** Facility Map types — mirror BuildingResource / ZoneResource / FacilityMapController::index(). */

export type FeedStatus = "live" | "stale" | "offline" | "no_feed";

export interface FacilityCameraPin {
  id: string;
  label: string;
  type: string;
  feed_status: FeedStatus;
  /** null = unplaced on the facility map; 0–100 building-relative pct when placed. */
  map_x: number | null;
  /** null = unplaced on the facility map; 0–100 building-relative pct when placed. */
  map_y: number | null;
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

export type UpdateZonePayload = Partial<CreateZonePayload>;


/** Minimal camera shape returned by GET vision-guard/sources, projected to the
 *  fields the Facility Map's Unplaced Cameras panel needs.  The backend's
 *  CameraSourceResource already emits map_x/map_y on every response; this type
 *  just makes those fields visible to the facility feature. */
export interface AllOrgCamera {
  id: string;
  label: string;
  type: string;
  /** Freeform building name the registrar typed — matched against building.name
   *  by the backend when rendering zone cameras, and by the unplaced-cameras
   *  collector on the frontend. */
  site: string | null;
  feed_status: FeedStatus;
  /** null = not yet placed on the facility map. */
  map_x: number | null;
  /** null = not yet placed on the facility map. */
  map_y: number | null;
}
/** PATCH /vision-guard/camera-sources/{id} — map position and site/zone assignment. */
export interface UpdateCameraPositionPayload {
  map_x: number | null;
  map_y: number | null;
  /** Building name to persist on the camera record (used for FacilityMap grouping). */
  site?: string | null;
  /** Zone name to persist on the camera record (used for FacilityMap grouping). */
  zone?: string | null;
}
