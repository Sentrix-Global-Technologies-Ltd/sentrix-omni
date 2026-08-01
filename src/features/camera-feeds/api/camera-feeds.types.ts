/** Camera feed types — mirror the backend CameraSourceResource. */

export type FeedStatus = "live" | "stale" | "offline" | "no_feed";

/** The 8 types offered by the "Add Camera Source" panel — mirrors the
 * backend's SourceType::orgPickerValues() exactly. `vehicle_camera` remains a
 * valid value elsewhere (consumer self-registration) but isn't offered here. */
export type OrgCameraSourceType =
  | "ip_camera"
  | "cctv"
  | "rtsp"
  | "phone"
  | "dashcam"
  | "smart_glasses"
  | "upload"
  | "external_cctv";

export interface CameraSource {
  id: string;
  type: string;
  label: string;
  organization_id: string;
  site: string | null;
  zone: string | null;
  connection_url: string | null;
  tags: string[];
  status: string;
  metadata: Record<string, unknown> | null;
  last_frame_url: string | null;
  last_frame_at: string | null;
  feed_status: FeedStatus;
  /** Derived recency heuristic (0-100), null if the source has never pushed a frame. See CameraSource::healthScore() on the backend. */
  health_score: number | null;
  created_at: string | null;
}

export interface CameraFeedFilters {
  site?: string;
  type?: string;
  status?: string;
  q?: string;
  page?: number;
}

/** `GET vision-guard/sources/summary` — Command Center camera-count KPI. */
export interface CameraSourcesSummary {
  total: number;
  online: number;
}

export interface CreateCameraSourcePayload {
  type: OrgCameraSourceType;
  label: string;
  site?: string;
  zone?: string;
  connection_url?: string;
  tags?: string[];
}

export interface UpdateCameraSourcePayload {
  label?: string;
  site?: string;
  zone?: string;
  connection_url?: string;
  tags?: string[];
  status?: "active" | "inactive";
}
