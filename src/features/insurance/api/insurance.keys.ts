import type { PageFilter } from "./insurance.types";

/** Insurance is organization-scoped. */
export const insuranceKeys = {
  all: (orgId: string) => ["insurance", orgId] as const,
  risk: (orgId: string) => ["insurance", orgId, "risk"] as const,
  policies: (orgId: string, f: PageFilter) => ["insurance", orgId, "policies", f] as const,
  claims: (orgId: string, f: PageFilter) => ["insurance", orgId, "claims", f] as const,
};
