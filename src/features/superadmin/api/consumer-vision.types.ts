/** Platform consumer VisionGuard review types — mirror the backend
 * PlatformCameraSourceResource / PlatformMediaAssetResource. Personal
 * (user_id-owned) sources/media only — organization-owned Site Bridge data
 * has its own dashboard feature (camera-feeds / evidence). */

export type ConsumerSourceType = "phone" | "smart_glasses" | "dashcam" | "vehicle_camera" | "cctv" | "upload";
export type ConsumerFeedStatus = "live" | "stale" | "offline" | "no_feed";

export interface ConsumerCameraSource {
  id: string;
  user?: { id: string; name: string; email: string };
  type: ConsumerSourceType;
  label: string;
  status: string;
  metadata: Record<string, unknown> | null;
  last_frame_url: string | null;
  last_frame_at: string | null;
  feed_status: ConsumerFeedStatus;
  created_at: string | null;
}

export interface ConsumerMediaAsset {
  id: string;
  user?: { id: string; name: string; email: string };
  camera_source: { id: string; type: ConsumerSourceType; label: string } | null;
  url: string;
  content_type: string | null;
  size_bytes: number | null;
  status: string;
  trip_id: string | null;
  emergency_id: string | null;
  captured_at: string | null;
  created_at: string | null;
}

export interface ConsumerSourcesFilters {
  user_id?: string;
  type?: string;
  page?: number;
}

export interface ConsumerMediaFilters {
  user_id?: string;
  status?: string;
  page?: number;
}
