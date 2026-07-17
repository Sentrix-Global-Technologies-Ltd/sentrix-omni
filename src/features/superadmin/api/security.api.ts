import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface SecurityPosture {
  auth: {
    guard: string;
    token_expiration_minutes: number | null;
    stateful_domains: string[];
  };
  cors: {
    allowed_origins: string[];
    allowed_origins_patterns: string[];
    supports_credentials: boolean;
    paths: string[];
  };
  rate_limits: Record<
    string,
    {
      description: string;
      [key: string]: string | number;
    }
  >;
  response_headers: Record<string, string>;
}

/** Sentrix Console (platform-staff) — read-only security posture report. */
export const securityApi = {
  posture(): Promise<ApiResult<SecurityPosture>> {
    return apiClient.get<SecurityPosture>("platform/security-posture");
  },
};
