/** Billing is organization-scoped (the org's own Sentrix subscription), not
 *  per-user — there is no per-user consumer plan in this system. */
export const billingKeys = {
  all: (orgId: string) => ["billing", orgId] as const,
  subscription: (orgId: string) => ["billing", orgId, "subscription"] as const,
  plans: () => ["billing", "plans"] as const,
  invoices: (orgId: string) => ["billing", orgId, "invoices"] as const,
  checkout: (orgId: string, reference: string) => ["billing", orgId, "checkout", reference] as const,
  platformSubscriptions: () => ["billing", "platform", "subscriptions"] as const,
};
