import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { CameraFeedFilters, CameraSource } from "./camera-feeds.types";

const base = (orgId: string) => `organizations/${orgId}/vision-guard/sources`;

/** Live Feeds — read-only view of the org's registered camera sources +
 * their latest pushed frame. Same tab group as Site Bridges; this is the
 * viewing side, Site Bridges is the credential-lifecycle side. */
export const cameraFeedsApi = {
  list(orgId: string, filters: CameraFeedFilters): Promise<ApiResult<CameraSource[]>> {
    return apiClient.get<CameraSource[]>(base(orgId), {
      query: { site: filters.site || undefined, page: filters.page },
    });
  },
};
