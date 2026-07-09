import type { CameraFeedFilters } from "./camera-feeds.types";

/** Camera feeds (VisionGuard sources) are organization-scoped. */
export const cameraFeedKeys = {
  all: (orgId: string) => ["camera-feeds", orgId] as const,
  list: (orgId: string, filters: CameraFeedFilters) => ["camera-feeds", orgId, "list", filters] as const,
};
