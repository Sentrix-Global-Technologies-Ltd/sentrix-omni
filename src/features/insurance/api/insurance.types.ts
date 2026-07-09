/** Insurance types — policies + claims (mirror backend resources, org-scoped). */

export interface Policy {
  id: string;
  organization_id: string;
  created_by: string | null;
  title: string;
  status: string;
  premium_cents: number;
  currency: string;
  coverage: unknown;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
}

export interface Claim {
  id: string;
  organization_id: string;
  policy_id: string;
  filed_by: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  decided_by: string | null;
  decided_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface PageFilter {
  page?: number;
}

/** A risk-priced annual premium quote, with the Sentrix saving versus a flat baseline insurer. */
export interface RiskQuote {
  score: number;
  band: string;
  currency: string;
  baseline_premium_cents: number;
  premium_cents: number;
  sentrix_saving_cents: number;
  factors: Record<string, unknown>;
}
