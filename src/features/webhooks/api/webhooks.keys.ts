/** Webhooks are organization-scoped. */
export const webhookKeys = {
  all: (orgId: string) => ["webhooks", orgId] as const,
  list: (orgId: string) => ["webhooks", orgId, "list"] as const,
  deliveries: (orgId: string, id: string) => ["webhooks", orgId, "deliveries", id] as const,
  /** Org-wide delivery feed (GET webhook-deliveries), optionally filtered by outcome. */
  orgDeliveries: (orgId: string, filters: { success?: boolean }) =>
    ["webhooks", orgId, "deliveries", "org", filters] as const,
};
