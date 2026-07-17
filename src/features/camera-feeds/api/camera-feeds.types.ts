/** Camera feed types — mirror the backend CameraSourceResource. */

export type FeedStatus = "live" | "stale" | "offline" | "no_feed";

export interface CameraSource {
  id: string;
  type: string;
  label: string;
  organization_id: string;
  site: string | null;
  zone: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  last_frame_url: string | null;
  last_frame_at: string | null;
  feed_status: FeedStatus;
  created_at: string | null;
}

export interface CameraFeedFilters {
  site?: string;
  page?: number;
}

/** `GET vision-guard/sources/summary` — Command Center camera-count KPI. */
export interface CameraSourcesSummary {
  total: number;
  online: number;
}
