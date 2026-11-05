/** Billing types — organization-scoped subscription, plans, invoices. There
 *  is no per-user consumer plan in this system; Sentrix bills the
 *  organization. */

export interface Subscription {
  organization_id: string;
  plan_key: string;
  plan_name: string;
  status: string;
  /** Stored status, except a paid plan past its period end reads "past_due" during the grace window, then "expired". */
  derived_status?: string;
  /** Set while "past_due": when full access ends and the org moves to Free. */
  grace_ends_at?: string | null;
  auto_renew: boolean;
  payment_method: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  entitlements: unknown;
}

/** What picking a plan means for THIS organization right now (server rules). */
export type PlanChangeAction =
  | "current"
  | "subscribe"
  | "renew"
  | "upgrade"
  | "downgrade_now"
  | "cancel_at_period_end"
  | "scheduled_downgrade";

export interface PlanOption {
  key: string;
  name: string;
  action: PlanChangeAction;
  allowed: boolean;
  immediate: boolean;
  /** Button text, e.g. "Upgrade & pay" or "Available from 4 Nov 2027". */
  label: string;
  /** Why it is not available / what will happen, when worth saying. */
  reason: string | null;
  effective_at: string | null;
  price: {
    currency: string;
    subtotal_cents: number;
    credit_cents: number;
    tax_cents: number;
    amount_cents: number;
  };
}

/* ------------------------------------------------------------------ */
/* SuperAdmin billing console (platform/billing/*) — read-only.        */
/* Customers only: Sentrix Monitoring and internal accounts are never  */
/* returned. `status` is DERIVED server-side (a lapsed paid plan reads */
/* "expired"); `stored_status` is what the database holds.             */
/* ------------------------------------------------------------------ */

export type PlatformBillingStatus = "active" | "trialing" | "cancelled" | "expired";
export type PlatformBillingSegment = "organizations" | "individuals";

export interface PlatformBillingPayment {
  reference: string;
  plan_key: string;
  plan_name: string;
  amount_cents: number;
  currency: string;
  subtotal_cents: number | null;
  tax_cents: number | null;
  status: "pending" | "paid" | "failed";
  /** Pending checkout nobody completed within 24h — display only. */
  abandoned: boolean;
  provider: string | null;
  region: string | null;
  paid_at: string | null;
  created_at: string | null;
}

interface PlatformBillingCustomer {
  plan_key: string;
  plan_name: string;
  status: PlatformBillingStatus;
  stored_status: string;
  /** False when no subscription row exists (reported as Free, nothing is created). */
  has_subscription_record: boolean;
  auto_renew: boolean | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  last_payment_at: string | null;
  created_at: string | null;
}

export interface PlatformBillingOrganization extends PlatformBillingCustomer {
  organization_id: string;
  name: string;
  slug: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  owner: { name: string; email: string; phone: string | null } | null;
  /** Detail view only. */
  payments?: PlatformBillingPayment[];
  invoices?: Invoice[];
}

export interface PlatformBillingIndividual extends PlatformBillingCustomer {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  /** Detail view only — for individuals the paid payment row is the receipt. */
  receipts?: PlatformBillingPayment[];
}

export interface PlatformBillingSegmentSummary {
  total: number;
  paying: number;
  by_status: Record<PlatformBillingStatus, number>;
  by_plan: Record<string, number>;
}

export interface PlatformBillingPaymentCounts {
  paid: number;
  failed: number;
  pending: number;
  abandoned: number;
}

export interface PlatformBillingRevenueRow {
  currency: string;
  paid_total_cents: number;
  paid_last_30_days_cents: number;
  payments_count: number;
}

export interface PlatformBillingSummary {
  generated_at: string;
  organizations: PlatformBillingSegmentSummary;
  individuals: PlatformBillingSegmentSummary;
  payments: Record<PlatformBillingSegment, PlatformBillingPaymentCounts>;
  revenue: Record<PlatformBillingSegment, PlatformBillingRevenueRow[]>;
}

export interface PlatformBillingFilters {
  q?: string;
  plan_key?: string;
  status?: PlatformBillingStatus | "";
  sort?: "recent" | "name" | "period_end";
  page?: number;
  per_page?: number;
}

export interface Plan {
  key: string;
  name: string;
  price_cents: number;
  price: string;
  /** VAT/tax on top of the price, in minor units (checkout adds this). */
  tax_cents?: number;
  /** What the payer is actually charged (price + tax), in minor units. */
  amount_cents?: number;
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
