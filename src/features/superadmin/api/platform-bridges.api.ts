import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface PlatformBridgeOnboardResult {
  organization_id: string;
  organization_name: string;
  bridge: unknown;
  bridge_key: string;
}

/** Sentrix Console (platform-staff) — provision a Site Bridge for a client
 * organization on their behalf (hardware.provision PlatformPermission). */
export const platformBridgesApi = {
  onboard(payload: {
    organization_id: string;
    label: string;
  }): Promise<ApiResult<PlatformBridgeOnboardResult>> {
    return apiClient.post<PlatformBridgeOnboardResult>("platform/vision-guard/bridges", payload);
  },
};
