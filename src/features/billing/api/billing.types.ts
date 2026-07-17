/** Billing types — organization-scoped subscription, plans, invoices. There
 *  is no per-user consumer plan in this system; Sentrix bills the
 *  organization. */

export interface Subscription {
  organization_id: string;
  plan_key: string;
  plan_name: string;
  status: string;
  auto_renew: boolean;
  payment_method: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  entitlements: unknown;
}

/** Platform (SuperAdmin-only) cross-tenant subscription oversight row. */
export interface OrganizationSubscriptionOverview {
  organization_id: string;
  organization_name: string | null;
  organization_slug: string | null;
  plan_key: string;
  plan_name: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  updated_at: string | null;
}

export interface Plan {
  key: string;
  name: string;
  price_cents: number;
  price: string;
  currency: string;
  interval: string;
  popular: boolean;
  entitlements: string[];
}

export interface Invoice {
  id: string;
  number: string;
  plan_key: string;
  amount_cents: number;
  amount: string;
  currency: string;
  status: string;
  issued_at: string | null;
}

/** Result of starting a PSP checkout session (ADR-0001). */
export interface CheckoutSession {
  reference: string;
  checkout_url: string;
  amount_cents: number;
  currency: string;
}

/** A checkout's underlying payment — polled by reference via `show`. */
export interface Payment {
  reference: string;
  plan_key: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider: string;
  region: string | null;
  paid_at: string | null;
  created_at: string | null;
}
