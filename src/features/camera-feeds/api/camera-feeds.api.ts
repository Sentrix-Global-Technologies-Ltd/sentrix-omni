import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CameraFeedFilters,
  CameraSource,
  CameraSourcesSummary,
  CreateCameraSourcePayload,
  UpdateCameraSourcePayload,
} from "./camera-feeds.types";

const base = (orgId: string) => `organizations/${orgId}/vision-guard/sources`;
const writeBase = (orgId: string) => `organizations/${orgId}/vision-guard/camera-sources`;

/** Live Feeds — read-only view of the org's registered camera sources +
 * their latest pushed frame. Same tab group as Site Bridges; this is the
 * viewing side, Site Bridges is the credential-lifecycle side.
 *
 * The create/update/delete methods below hit OrganizationCameraSourceController
 * (the org-admin "Add Camera Source" flow) — a different write path than the
 * read above, but the same underlying CameraSource rows, so this list/summary
 * refetches after any mutation. */
export const cameraFeedsApi = {
  list(orgId: string, filters: CameraFeedFilters): Promise<ApiResult<CameraSource[]>> {
    return apiClient.get<CameraSource[]>(base(orgId), {
      query: {
        site: filters.site || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        q: filters.q || undefined,
        page: filters.page,
      },
    });
  },

  /** Total vs. online camera count — the Command Center KPI tile. */
  summary(orgId: string): Promise<ApiResult<CameraSourcesSummary>> {
    return apiClient.get<CameraSourcesSummary>(`${base(orgId)}/summary`);
  },

  create(orgId: string, payload: CreateCameraSourcePayload): Promise<ApiResult<CameraSource>> {
    return apiClient.post<CameraSource>(writeBase(orgId), payload);
  },

  update(orgId: string, sourceId: string, payload: UpdateCameraSourcePayload): Promise<ApiResult<CameraSource>> {
    return apiClient.patch<CameraSource>(`${writeBase(orgId)}/${sourceId}`, payload);
  },

  remove(orgId: string, sourceId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${writeBase(orgId)}/${sourceId}`);
  },
};
