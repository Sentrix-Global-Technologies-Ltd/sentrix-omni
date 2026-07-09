import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { CreateLeadInput, Lead, LeadFilters } from "./leads.types";

/** Platform CRM leads (not org-scoped). */
export const leadsApi = {
  list(filters: LeadFilters): Promise<ApiResult<Lead[]>> {
    return apiClient.get<Lead[]>("leads", {
      query: {
        stage: filters.stage || undefined,
        client_type: filters.client_type || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    });
  },

  detail(id: string): Promise<ApiResult<Lead>> {
    return apiClient.get<Lead>(`leads/${id}`);
  },

  // --- Write actions (SuperAdmin; server-confirmed) ---
  create(data: CreateLeadInput): Promise<ApiResult<Lead>> {
    return apiClient.post<Lead>("leads", data);
  },
  update(id: string, payload: { stage?: string; notes?: string }): Promise<ApiResult<Lead>> {
    return apiClient.patch<Lead>(`leads/${id}`, payload);
  },
  convert(id: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`leads/${id}/convert`);
  },
  quote(id: string, quote: Record<string, unknown>): Promise<ApiResult<Lead>> {
    return apiClient.post<Lead>(`leads/${id}/quote`, { quote });
  },
};
