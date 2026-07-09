/** Billing is user-scoped (account subscription), not org-scoped. */
export const billingKeys = {
  all: () => ["billing"] as const,
  subscription: () => ["billing", "subscription"] as const,
  plans: () => ["billing", "plans"] as const,
  invoices: () => ["billing", "invoices"] as const,
  checkout: (reference: string) => ["billing", "checkout", reference] as const,
};
