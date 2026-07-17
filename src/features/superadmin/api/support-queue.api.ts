import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { SupportTicket } from "../../support/api/support.types";

export interface SupportQueueFilters {
  status?: string;
  organization_id?: string;
  page?: number;
}

export interface TriageSupportTicketPayload {
  status?: string;
  resolution_notes?: string;
  assign_to_self?: boolean;
}

/** Sentrix Console (platform-staff) — cross-tenant support ticket triage.
 * Gated on support.tickets.view (read) / support.tickets.manage (write)
 * PlatformPermissions, held by the CustomerSupport PlatformRole. */
export const supportQueueApi = {
  list(filters: SupportQueueFilters): Promise<ApiResult<SupportTicket[]>> {
    return apiClient.get<SupportTicket[]>("platform/support/tickets", {
      query: {
        status: filters.status || undefined,
        organization_id: filters.organization_id || undefined,
        page: filters.page,
      },
    });
  },

  triage(id: string, payload: TriageSupportTicketPayload): Promise<ApiResult<SupportTicket>> {
    return apiClient.patch<SupportTicket>(`platform/support/tickets/${id}`, payload);
  },
};
