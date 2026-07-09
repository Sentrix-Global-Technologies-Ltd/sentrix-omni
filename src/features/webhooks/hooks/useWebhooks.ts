import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { webhooksApi } from "../api/webhooks.api";
import { webhookKeys } from "../api/webhooks.keys";

export function useWebhooks() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: webhookKeys.list(activeId ?? "none"),
    queryFn: () => webhooksApi.list(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function useWebhookDeliveries(id: string, enabled: boolean) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: webhookKeys.deliveries(activeId ?? "none", id),
    queryFn: () => webhooksApi.deliveries(activeId as string, id),
    enabled: enabled && Boolean(activeId),
  });
}

export function useWebhookActions() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: webhookKeys.all(activeId) });
  };
  return {
    create: useMutation({
      mutationFn: (payload: { url: string; events: string[]; description?: string }) =>
        webhooksApi.create(activeId as string, payload),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => webhooksApi.remove(activeId as string, id),
      onSuccess,
    }),
  };
}
