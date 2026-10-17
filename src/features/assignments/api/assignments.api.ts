import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  Assignment,
  AssignmentFilters,
  AssignmentRecommendations,
  AssignmentResponderLine,
  CreateAssignmentInput,
} from "./assignments.types";

const base = (orgId: string) => `organizations/${orgId}/assignments`;

/** Endpoint module — thin, typed wrapper over the API client. No logic. */
export const assignmentsApi = {
  list(orgId: string, filters: AssignmentFilters): Promise<ApiResult<Assignment[]>> {
    return apiClient.get<Assignment[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        incident_id: filters.incident_id || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    });
  },

  detail(orgId: string, id: string): Promise<ApiResult<Assignment>> {
    return apiClient.get<Assignment>(`${base(orgId)}/${id}`);
  },

  /** Open a dispatch coordination record for an incident (the "start dispatching" action). */
  create(orgId: string, data: CreateAssignmentInput): Promise<ApiResult<Assignment>> {
    return apiClient.post<Assignment>(base(orgId), data);
  },

  // --- Dispatch actions (server-confirmed; backend enforces guards) ---
  cancel(orgId: string, id: string): Promise<ApiResult<Assignment>> {
    return apiClient.post<Assignment>(`${base(orgId)}/${id}/cancel`);
  },
  complete(orgId: string, id: string): Promise<ApiResult<Assignment>> {
    return apiClient.post<Assignment>(`${base(orgId)}/${id}/complete`);
  },

  /** Ranked candidate responders for this assignment (proximity when the incident has coordinates, else recency). */
  recommendations(orgId: string, id: string): Promise<ApiResult<AssignmentRecommendations>> {
    return apiClient.get<AssignmentRecommendations>(`${base(orgId)}/${id}/recommendations`);
  },

  // --- Dispatch: offer a responder + drive their line lifecycle ---
  addResponder(
    orgId: string,
    id: string,
    responderId: string,
    role?: string,
  ): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders`, {
      responder_id: responderId,
      role,
    });
  },
  acceptLine(orgId: string, id: string, lineId: string): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders/${lineId}/accept`);
  },
  declineLine(
    orgId: string,
    id: string,
    lineId: string,
    reason?: string,
  ): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders/${lineId}/decline`, {
      reason,
    });
  },
  enRouteLine(orgId: string, id: string, lineId: string): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders/${lineId}/en-route`);
  },
  onSceneLine(orgId: string, id: string, lineId: string): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders/${lineId}/on-scene`);
  },
  completeLine(orgId: string, id: string, lineId: string): Promise<ApiResult<AssignmentResponderLine>> {
    return apiClient.post<AssignmentResponderLine>(`${base(orgId)}/${id}/responders/${lineId}/complete`);
  },
};
