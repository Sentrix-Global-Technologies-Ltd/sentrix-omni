import type { SourceFilters, WriteFilters } from "./ledger.types";

/** Ledger is platform-scoped (SuperAdmin), not org-scoped. */
export const ledgerKeys = {
  all: () => ["ledger"] as const,
  stats: () => ["ledger", "stats"] as const,
  sources: (filters: SourceFilters) => ["ledger", "sources", filters] as const,
  writes: (filters: WriteFilters) => ["ledger", "writes", filters] as const,
};
