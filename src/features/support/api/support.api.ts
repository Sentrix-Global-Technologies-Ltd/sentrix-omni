import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  SubmitSupportTicketPayload,
  SupportTicket,
  SupportTicketFilters,
} from "./support.types";

const base = (orgId: string) => `organizations/${orgId}/support/tickets`;

/** Org-scoped "raise an issue" surface — Supervisor-tier only (Supervisor and
 * OrganizationAdmin; see OrganizationRole.php), and self-only beyond that: a
 * Supervisor submits a ticket and sees their own history, not their
 * org-mates'. Cross-org triage lives in the platform-scoped supportQueueApi
 * instead (features/superadmin). */
export const supportApi = {
  list(orgId: string, filters: SupportTicketFilters): Promise<ApiResult<SupportTicket[]>> {
    return apiClient.get<SupportTicket[]>(base(orgId), {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },

  submit(orgId: string, payload: SubmitSupportTicketPayload): Promise<ApiResult<SupportTicket>> {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("description", payload.description);
    form.append("category", payload.category);
    if (payload.category === "other" && payload.other_category) {
      form.append("other_category", payload.other_category);
    }
    if (payload.screenshot) form.append("screenshot", payload.screenshot);
    return apiClient.postForm<SupportTicket>(base(orgId), form);
  },

  show(orgId: string, id: string): Promise<ApiResult<SupportTicket>> {
    return apiClient.get<SupportTicket>(`${base(orgId)}/${id}`);
  },
};
