import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CheckoutSession,
  Invoice,
  Payment,
  Plan,
  PlatformBillingFilters,
  PlatformBillingIndividual,
  PlatformBillingOrganization,
  PlatformBillingSummary,
  Subscription,
} from "./billing.types";

const base = (orgId: string) => `organizations/${orgId}`;

/** Billing endpoints — organization-scoped (billing.view/billing.manage,
 *  OrganizationAdmin only). There is no per-user consumer plan in this
 *  system; Sentrix bills the organization. */
export const billingApi = {
  subscription(orgId: string): Promise<ApiResult<Subscription>> {
    return apiClient.get<Subscription>(`${base(orgId)}/subscription`);
  },
  plans(): Promise<ApiResult<Plan[]>> {
    return apiClient.get<Plan[]>("plans");
  },
  invoices(orgId: string): Promise<ApiResult<Invoice[]>> {
    return apiClient.get<Invoice[]>(`${base(orgId)}/billing/invoices`);
  },
  subscribe(orgId: string, plan: string): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>(`${base(orgId)}/subscription`, { plan });
  },
  cancel(orgId: string): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>(`${base(orgId)}/subscription/cancel`);
  },
  autoRenew(orgId: string, autoRenew: boolean): Promise<ApiResult<Subscription>> {
    return apiClient.patch<Subscription>(`${base(orgId)}/subscription/auto-renew`, { auto_renew: autoRenew });
  },
  checkout(orgId: string, planKey: string, region?: string | null): Promise<ApiResult<CheckoutSession>> {
    return apiClient.post<CheckoutSession>(`${base(orgId)}/billing/checkout`, { plan_key: planKey, region });
  },
  checkoutStatus(orgId: string, reference: string): Promise<ApiResult<Payment>> {
    return apiClient.get<Payment>(`${base(orgId)}/billing/checkout/${reference}`);
  },
  simulateCheckout(orgId: string, reference: string): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>(`${base(orgId)}/billing/checkout/${reference}/simulate`);
  },
};

/** Drop empty filter values so they never reach the query string. */
function cleanFilters(filters: PlatformBillingFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value;
  }
  return out;
}

const platform = "platform/billing";

/** Sentrix Console (SuperAdmin only) — read-only billing console: customer
 *  organizations and individuals, derived status, payment history and
 *  invoices/receipts. Internal Sentrix accounts are excluded server-side. */
export const platformBillingApi = {
  summary(): Promise<ApiResult<PlatformBillingSummary>> {
    return apiClient.get<PlatformBillingSummary>(`${platform}/summary`);
  },
  organizations(filters: PlatformBillingFilters): Promise<ApiResult<PlatformBillingOrganization[]>> {
    return apiClient.get<PlatformBillingOrganization[]>(`${platform}/organizations`, { query: cleanFilters(filters) });
  },
  organization(id: string): Promise<ApiResult<PlatformBillingOrganization>> {
    return apiClient.get<PlatformBillingOrganization>(`${platform}/organizations/${id}`);
  },
  individuals(filters: PlatformBillingFilters): Promise<ApiResult<PlatformBillingIndividual[]>> {
    return apiClient.get<PlatformBillingIndividual[]>(`${platform}/individuals`, { query: cleanFilters(filters) });
  },
  individual(id: string): Promise<ApiResult<PlatformBillingIndividual>> {
    return apiClient.get<PlatformBillingIndividual>(`${platform}/individuals/${id}`);
  },
};
