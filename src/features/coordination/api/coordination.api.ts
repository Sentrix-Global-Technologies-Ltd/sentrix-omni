import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CoordinationAnalytics,
  DutyEntry,
  DutyFilters,
  MutualAidFilters,
  MutualAidRequest,
  Tasking,
  TaskingFilters,
  ThreadFilters,
  UnitMessage,
} from "./coordination.types";

/** Coordination endpoints (platform/SuperAdmin) — /command/*. Shares the same
 * v1/command prefix as the Command & Cad endpoints (command.api.ts); split into
 * its own file because it's a distinct backend domain (Coordination). */
export const coordinationApi = {
  // ---- Mutual aid ----
  mutualAid(filters: MutualAidFilters): Promise<ApiResult<MutualAidRequest[]>> {
    return apiClient.get<MutualAidRequest[]>("command/mutual-aid", {
      query: {
        status: filters.status || undefined,
        command_incident_id: filters.command_incident_id || undefined,
        page: filters.page,
      },
    });
  },
  requestAid(payload: {
    command_incident_id: string;
    requesting_command_id: string;
    responding_command_id: string;
    message?: string;
  }): Promise<ApiResult<MutualAidRequest>> {
    return apiClient.post<MutualAidRequest>("command/mutual-aid", payload);
  },
  acceptAid(id: string): Promise<ApiResult<MutualAidRequest>> {
    return apiClient.post<MutualAidRequest>(`command/mutual-aid/${id}/accept`, {});
  },
  declineAid(id: string): Promise<ApiResult<MutualAidRequest>> {
    return apiClient.post<MutualAidRequest>(`command/mutual-aid/${id}/decline`, {});
  },

  // ---- Unit comms ----
  thread(unitId: string, filters: ThreadFilters): Promise<ApiResult<UnitMessage[]>> {
    return apiClient.get<UnitMessage[]>(`command/units/${unitId}/messages`, {
      query: { page: filters.page },
    });
  },
  sendMessage(
    unitId: string,
    payload: { body: string; direction?: string; command_incident_id?: string },
  ): Promise<ApiResult<UnitMessage>> {
    return apiClient.post<UnitMessage>(`command/units/${unitId}/messages`, payload);
  },

  // ---- Command analytics (read-only computed) ----
  analytics(days?: number): Promise<ApiResult<CoordinationAnalytics>> {
    return apiClient.get<CoordinationAnalytics>("command/analytics", { query: { days } });
  },

  // ---- Taskings ----
  taskings(filters: TaskingFilters): Promise<ApiResult<Tasking[]>> {
    return apiClient.get<Tasking[]>("command/taskings", {
      query: {
        status: filters.status || undefined,
        kind: filters.kind || undefined,
        page: filters.page,
      },
    });
  },
  routeTasking(payload: {
    title: string;
    kind?: string;
    ref?: string;
    assignee?: string;
  }): Promise<ApiResult<Tasking>> {
    return apiClient.post<Tasking>("command/taskings", payload);
  },
  acknowledgeTasking(id: string): Promise<ApiResult<Tasking>> {
    return apiClient.post<Tasking>(`command/taskings/${id}/ack`, {});
  },
  resolveTasking(id: string): Promise<ApiResult<Tasking>> {
    return apiClient.post<Tasking>(`command/taskings/${id}/resolve`, {});
  },

  // ---- Duty book ----
  duty(filters: DutyFilters): Promise<ApiResult<DutyEntry[]>> {
    return apiClient.get<DutyEntry[]>("command/duty", {
      query: { scope_type: filters.scope_type || undefined, page: filters.page },
    });
  },
  recordDuty(payload: {
    action: string;
    scope_type: string;
    scope_id: string;
    person_name: string;
    role?: string;
  }): Promise<ApiResult<DutyEntry>> {
    return apiClient.post<DutyEntry>("command/duty", payload);
  },
};
