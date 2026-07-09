import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Claim, PageFilter, Policy, RiskQuote } from "./insurance.types";

const base = (orgId: string) => `organizations/${orgId}/insurance`;

/** Insurance endpoints (org-scoped). */
export const insuranceApi = {
  risk(orgId: string): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.get<Record<string, unknown>>(`${base(orgId)}/risk`);
  },
  quote(orgId: string, payload: { currency?: string } = {}): Promise<ApiResult<RiskQuote>> {
    return apiClient.post<RiskQuote>(`${base(orgId)}/quote`, payload);
  },
  policies(orgId: string, f: PageFilter): Promise<ApiResult<Policy[]>> {
    return apiClient.get<Policy[]>(`${base(orgId)}/policies`, { query: { page: f.page } });
  },
  claims(orgId: string, f: PageFilter): Promise<ApiResult<Claim[]>> {
    return apiClient.get<Claim[]>(`${base(orgId)}/claims`, { query: { page: f.page } });
  },
  createPolicy(
    orgId: string,
    payload: { title: string; premium_cents: number; currency?: string },
  ): Promise<ApiResult<Policy>> {
    return apiClient.post<Policy>(`${base(orgId)}/policies`, payload);
  },
  fileClaim(
    orgId: string,
    payload: { policy_id: string; amount_cents: number; currency?: string; description?: string },
  ): Promise<ApiResult<Claim>> {
    return apiClient.post<Claim>(`${base(orgId)}/claims`, payload);
  },
  decideClaim(orgId: string, id: string, decision: string): Promise<ApiResult<Claim>> {
    return apiClient.post<Claim>(`${base(orgId)}/claims/${id}/decide`, { decision });
  },
};
