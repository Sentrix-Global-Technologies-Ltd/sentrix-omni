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
export function useCheckoutStatus(reference: string | null) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: billingKeys.checkout(activeId ?? "", reference ?? ""),
    queryFn: () => billingApi.checkoutStatus(activeId as string, reference as string),
    enabled: Boolean(activeId) && Boolean(reference),
  });
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
