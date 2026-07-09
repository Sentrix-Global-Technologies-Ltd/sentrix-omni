import type { LeadFilters } from "./leads.types";

/** Leads are platform-scoped (SuperAdmin), not org-scoped. */
export const leadKeys = {
  all: () => ["leads"] as const,
  list: (filters: LeadFilters) => ["leads", "list", filters] as const,
  detail: (id: string) => ["leads", "detail", id] as const,
};
