import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { CheckoutSession, Invoice, Payment, Plan, Subscription } from "./billing.types";

/** Billing endpoints (user-scoped: /plans + /me/*). */
export const billingApi = {
  subscription(): Promise<ApiResult<Subscription>> {
    return apiClient.get<Subscription>("me/subscription");
  },
  plans(): Promise<ApiResult<Plan[]>> {
    return apiClient.get<Plan[]>("plans");
  },
  invoices(): Promise<ApiResult<Invoice[]>> {
    return apiClient.get<Invoice[]>("me/billing/invoices");
  },
  subscribe(plan: string): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>("me/subscription", { plan });
  },
  cancel(): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>("me/subscription/cancel");
  },
  autoRenew(autoRenew: boolean): Promise<ApiResult<Subscription>> {
    return apiClient.patch<Subscription>("me/subscription/auto-renew", { auto_renew: autoRenew });
  },
  checkout(planKey: string, region?: string | null): Promise<ApiResult<CheckoutSession>> {
    return apiClient.post<CheckoutSession>("me/billing/checkout", { plan_key: planKey, region });
  },
  checkoutStatus(reference: string): Promise<ApiResult<Payment>> {
    return apiClient.get<Payment>(`me/billing/checkout/${reference}`);
  },
  simulateCheckout(reference: string): Promise<ApiResult<Subscription>> {
    return apiClient.post<Subscription>(`me/billing/checkout/${reference}/simulate`);
  },
};
