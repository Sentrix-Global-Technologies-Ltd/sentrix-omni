import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { GateEvent, GateFilters, Pass, PassFilters } from "./access.types";

const passesBase = (orgId: string) => `organizations/${orgId}/passes`;
const gateBase = (orgId: string) => `organizations/${orgId}/gate`;

/** Access control endpoints (org-scoped). */
export const accessApi = {
  passes(orgId: string, filters: PassFilters): Promise<ApiResult<Pass[]>> {
    return apiClient.get<Pass[]>(passesBase(orgId), {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },
  gate(orgId: string, filters: GateFilters): Promise<ApiResult<GateEvent[]>> {
    return apiClient.get<GateEvent[]>(gateBase(orgId), {
      query: { result: filters.result || undefined, page: filters.page },
    });
  },
  issuePass(
    orgId: string,
    payload: { visitor_name: string; type?: string; valid_until?: string },
  ): Promise<ApiResult<Pass>> {
    return apiClient.post<Pass>(passesBase(orgId), payload);
  },
  revokePass(orgId: string, id: string): Promise<ApiResult<Pass>> {
    return apiClient.post<Pass>(`${passesBase(orgId)}/${id}/revoke`);
  },
  scanGate(
    orgId: string,
    payload: { code: string; gate?: string; direction?: string },
  ): Promise<ApiResult<GateEvent>> {
    return apiClient.post<GateEvent>(`${gateBase(orgId)}/scan`, payload);
  },
  logGate(
    orgId: string,
    payload: { gate?: string; direction?: string; result?: string; visitor_name?: string },
  ): Promise<ApiResult<GateEvent>> {
    return apiClient.post<GateEvent>(gateBase(orgId), payload);
  },
};
