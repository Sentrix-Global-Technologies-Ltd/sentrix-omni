import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface PlatformSnapshot {
  open_incidents_by_severity: Record<string, number>;
  open_incidents_total: number;
  active_emergencies: number;
  on_duty_responders: number;
}

/** Result of a confirmed Core tool action (fail-safe: `ok:false` when offline). */
export interface CoreActResult {
  ok?: boolean;
  message?: string;
  _simulated?: boolean;
  [key: string]: unknown;
}

/** SentrixCore bridge — platform-wide (SuperAdmin) snapshot + tool actions. */
export const coreApi = {
  platformSnapshot(): Promise<ApiResult<PlatformSnapshot>> {
    return apiClient.get<PlatformSnapshot>("core/platform-snapshot");
  },
  /** Execute a confirmed Core tool action. Body schema is defined by Core. */
  act(body: Record<string, unknown>): Promise<ApiResult<CoreActResult>> {
    return apiClient.post<CoreActResult>("core/act", body);
  },
};
