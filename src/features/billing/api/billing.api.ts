import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CheckoutSession,
  Invoice,
  OrganizationSubscriptionOverview,
  Payment,
  Plan,
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

/** Sentrix Console (SuperAdmin only) — cross-tenant subscription oversight:
 *  which organizations are free/trialing/active/cancelled. */
export const platformBillingApi = {
  subscriptions(query?: { status?: string; plan_key?: string; page?: number }): Promise<ApiResult<OrganizationSubscriptionOverview[]>> {
    return apiClient.get<OrganizationSubscriptionOverview[]>("platform/subscriptions", { query });
  },
};
