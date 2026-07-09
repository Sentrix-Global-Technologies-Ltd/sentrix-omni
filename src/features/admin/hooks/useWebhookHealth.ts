import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { webhooksApi } from "../../webhooks/api/webhooks.api";
import { webhookKeys } from "../../webhooks/api/webhooks.keys";

/**
 * Failed-delivery count across every configured webhook, via the aggregate
 * `webhook-deliveries` endpoint filtered to `success=0`. One request with
 * `per_page=1`, reading `meta.total` for an exact count — no per-webhook
 * fan-out, and no need to pull every failed row just to count them.
 */
export function useWebhookHealth() {
  const { activeId } = useOrganization();

  const query = useQuery({
    queryKey: webhookKeys.orgDeliveries(activeId ?? "none", { success: false }),
    queryFn: () => webhooksApi.orgDeliveries(activeId as string, { success: false }),
    enabled: Boolean(activeId),
  });

  const total = query.data?.meta?.total;

  return {
    failedCount: typeof total === "number" ? total : 0,
    isLoading: query.isLoading,
  };
}
