import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { billingApi, platformBillingApi } from "../api/billing.api";
import { billingKeys } from "../api/billing.keys";
import type { PlatformBillingFilters } from "../api/billing.types";

/** Invalidate every billing query under the active org after a write. */
function useOrgInvalidate() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: billingKeys.all(activeId) });
  };
}

export function useSubscription() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: billingKeys.subscription(activeId ?? ""),
    queryFn: () => billingApi.subscription(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billingApi.plans(),
  });
}

/** Server-computed meaning of each plan for the active organization. */
export function usePlanOptions() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: billingKeys.planOptions(activeId ?? ""),
    queryFn: () => billingApi.planOptions(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function useInvoices() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: billingKeys.invoices(activeId ?? ""),
    queryFn: () => billingApi.invoices(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function useBillingActions() {
  const { activeId } = useOrganization();
  const onSuccess = useOrgInvalidate();
  return {
    subscribe: useMutation({
      mutationFn: (plan: string) => billingApi.subscribe(activeId as string, plan),
      onSuccess,
    }),
    cancel: useMutation({
      mutationFn: () => billingApi.cancel(activeId as string),
      onSuccess,
    }),
    autoRenew: useMutation({
      mutationFn: (v: boolean) => billingApi.autoRenew(activeId as string, v),
      onSuccess,
    }),
  };
}

/**
 * PSP checkout flow: start a checkout session for the active organization,
 * then poll its status by reference. `simulate` is the env-gated stub-provider
 * completion helper (dev/test only, activates the subscription in place of a
 * real PSP redirect).
 */
const TERMINAL_PAYMENT_STATUSES = ["paid", "succeeded", "completed", "failed", "cancelled", "canceled"];
const MAX_STATUS_POLLS = 40;

/**
 * Polls a checkout by reference. With `poll`, keeps refetching every 3s while
 * the payment is still pending (the PSP webhook confirms it asynchronously)
 * and stops once it reaches a terminal state or after MAX_STATUS_POLLS tries.
 */
export function useCheckoutStatus(reference: string | null, options: { poll?: boolean } = {}) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: billingKeys.checkout(activeId ?? "", reference ?? ""),
    queryFn: () => billingApi.checkoutStatus(activeId as string, reference as string),
    enabled: Boolean(activeId) && Boolean(reference),
    refetchInterval: options.poll
      ? (query) => {
          const status = query.state.data?.data?.status;
          if (status && TERMINAL_PAYMENT_STATUSES.includes(status)) return false;
          return query.state.dataUpdateCount >= MAX_STATUS_POLLS ? false : 3000;
        }
      : false,
  });
}

/** Invoice PDF actions for the active organization (open in new window / download). */
export function useInvoicePdfActions() {
  const { activeId } = useOrganization();
  return {
    open: useMutation({
      mutationFn: (invoiceId: string) => billingApi.openInvoicePdf(activeId as string, invoiceId),
    }),
    download: useMutation({
      mutationFn: (invoice: { id: string; number: string }) =>
        billingApi.downloadInvoicePdf(activeId as string, invoice),
    }),
  };
}

export function useCheckoutActions() {
  const { activeId } = useOrganization();
  const onSuccess = useOrgInvalidate();
  return {
    checkout: useMutation({
      mutationFn: ({ planKey, region }: { planKey: string; region?: string | null }) =>
        billingApi.checkout(activeId as string, planKey, region),
    }),
    simulate: useMutation({
      mutationFn: (reference: string) => billingApi.simulateCheckout(activeId as string, reference),
      onSuccess,
    }),
  };
}

/* ---- Sentrix Console (SuperAdmin only): read-only billing console ---- */

export function usePlatformBillingSummary() {
  return useQuery({
    queryKey: billingKeys.platformSummary(),
    queryFn: () => platformBillingApi.summary(),
  });
}

export function usePlatformBillingOrganizations(filters: PlatformBillingFilters, enabled = true) {
  return useQuery({
    queryKey: billingKeys.platformOrganizations(filters),
    queryFn: () => platformBillingApi.organizations(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePlatformBillingIndividuals(filters: PlatformBillingFilters, enabled = true) {
  return useQuery({
    queryKey: billingKeys.platformIndividuals(filters),
    queryFn: () => platformBillingApi.individuals(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Customer detail (payment history + invoices/receipts). Pass null to stay idle. */
export function usePlatformBillingOrganization(id: string | null) {
  return useQuery({
    queryKey: billingKeys.platformOrganization(id ?? ""),
    queryFn: () => platformBillingApi.organization(id as string),
    enabled: Boolean(id),
  });
}

export function usePlatformBillingIndividual(id: string | null) {
  return useQuery({
    queryKey: billingKeys.platformIndividual(id ?? ""),
    queryFn: () => platformBillingApi.individual(id as string),
    enabled: Boolean(id),
  });
}
