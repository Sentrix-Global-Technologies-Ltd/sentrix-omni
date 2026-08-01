import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  ConsumerCameraSource,
  ConsumerMediaAsset,
  ConsumerMediaFilters,
  ConsumerSourcesFilters,
} from "./consumer-vision.types";

/** Sentrix Console (platform-staff) — read-only cross-user visibility into
 * consumer (personal) camera sources and uploaded evidence. Gated on
 * vision-guard.consumer.view (PlatformPermission), held by the
 * VisionGuardReviewer PlatformRole. No write actions — a consumer's own
 * sources/media are only ever managed from their own device. */
export const consumerVisionApi = {
  sources(filters: ConsumerSourcesFilters): Promise<ApiResult<ConsumerCameraSource[]>> {
    return apiClient.get<ConsumerCameraSource[]>("platform/vision-guard/consumer-sources", {
      query: {
        user_id: filters.user_id || undefined,
        type: filters.type || undefined,
        page: filters.page,
      },
    });
  },

  media(filters: ConsumerMediaFilters): Promise<ApiResult<ConsumerMediaAsset[]>> {
    return apiClient.get<ConsumerMediaAsset[]>("platform/vision-guard/consumer-media", {
      query: {
        user_id: filters.user_id || undefined,
        status: filters.status || undefined,
        page: filters.page,
      },
    });
  },
};
