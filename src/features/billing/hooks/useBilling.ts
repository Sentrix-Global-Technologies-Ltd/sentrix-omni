import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { billingApi } from "../api/billing.api";
import { billingKeys } from "../api/billing.keys";

export function useSubscription() {
  const { principal } = useAuth();
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => billingApi.subscription(),
    enabled: Boolean(principal),
  });
}

export function usePlans() {
  const { principal } = useAuth();
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billingApi.plans(),
    enabled: Boolean(principal),
  });
}

export function useInvoices() {
  const { principal } = useAuth();
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: () => billingApi.invoices(),
    enabled: Boolean(principal),
  });
}

export function useBillingActions() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: billingKeys.all() });
  return {
    subscribe: useMutation({ mutationFn: (plan: string) => billingApi.subscribe(plan), onSuccess }),
    cancel: useMutation({ mutationFn: () => billingApi.cancel(), onSuccess }),
    autoRenew: useMutation({ mutationFn: (v: boolean) => billingApi.autoRenew(v), onSuccess }),
  };
}

/**
 * PSP checkout flow (ADR-0001): start a checkout session, then poll its status
 * by reference. `simulate` is the env-gated stub-provider completion helper
 * (dev/test only, activates the subscription in place of a real PSP redirect).
 */
export function useCheckoutStatus(reference: string | null) {
  return useQuery({
    queryKey: billingKeys.checkout(reference ?? ""),
    queryFn: () => billingApi.checkoutStatus(reference as string),
    enabled: Boolean(reference),
  });
}

export function useCheckoutActions() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: billingKeys.all() });
  return {
    checkout: useMutation({
      mutationFn: ({ planKey, region }: { planKey: string; region?: string | null }) =>
        billingApi.checkout(planKey, region),
    }),
    simulate: useMutation({
      mutationFn: (reference: string) => billingApi.simulateCheckout(reference),
      onSuccess,
    }),
  };
}
