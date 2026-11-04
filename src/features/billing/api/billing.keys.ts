/** Billing is organization-scoped (the org's own Sentrix subscription), not
 *  per-user — there is no per-user consumer plan in this system. */
export const billingKeys = {
  all: (orgId: string) => ["billing", orgId] as const,
  subscription: (orgId: string) => ["billing", orgId, "subscription"] as const,
  plans: () => ["billing", "plans"] as const,
  invoices: (orgId: string) => ["billing", orgId, "invoices"] as const,
  checkout: (orgId: string, reference: string) => ["billing", orgId, "checkout", reference] as const,
  platform: () => ["billing", "platform"] as const,
  platformSummary: () => ["billing", "platform", "summary"] as const,
  platformOrganizations: (filters: object) => ["billing", "platform", "organizations", filters] as const,
  platformOrganization: (id: string) => ["billing", "platform", "organization", id] as const,
  platformIndividuals: (filters: object) => ["billing", "platform", "individuals", filters] as const,
  platformIndividual: (id: string) => ["billing", "platform", "individual", id] as const,
};
