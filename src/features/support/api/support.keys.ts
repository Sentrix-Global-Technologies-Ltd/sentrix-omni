import type { SupportTicketFilters } from "./support.types";

/** Support tickets are organization-scoped (the "my tickets" view). */
export const supportKeys = {
  all: (orgId: string) => ["support-tickets", orgId] as const,
  list: (orgId: string, filters: SupportTicketFilters) =>
    ["support-tickets", orgId, "list", filters] as const,
};
