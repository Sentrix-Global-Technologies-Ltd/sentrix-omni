import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Webhook, WebhookDelivery } from "./webhooks.types";

const base = (orgId: string) => `organizations/${orgId}/webhooks`;

/** Webhook management endpoints (org-scoped). */
export const webhooksApi = {
  list(orgId: string): Promise<ApiResult<Webhook[]>> {
    return apiClient.get<Webhook[]>(base(orgId));
  },
  create(
    orgId: string,
    payload: { url: string; events: string[]; description?: string },
  ): Promise<ApiResult<Webhook>> {
    return apiClient.post<Webhook>(base(orgId), payload);
  },
  remove(orgId: string, id: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`${base(orgId)}/${id}`);
  },
  deliveries(orgId: string, id: string): Promise<ApiResult<WebhookDelivery[]>> {
    return apiClient.get<WebhookDelivery[]>(`${base(orgId)}/${id}/deliveries`);
  },
  /** Org-wide delivery feed across every webhook — one request instead of a per-webhook fan-out. */
  orgDeliveries(orgId: string, filters: { success?: boolean } = {}): Promise<ApiResult<WebhookDelivery[]>> {
    return apiClient.get<WebhookDelivery[]>(`organizations/${orgId}/webhook-deliveries`, {
      query: { success: filters.success === undefined ? undefined : filters.success ? 1 : 0, per_page: 1 },
    });
  },
};
