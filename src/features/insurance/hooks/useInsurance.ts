import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { insuranceApi } from "../api/insurance.api";
import { insuranceKeys } from "../api/insurance.keys";
import type { PageFilter } from "../api/insurance.types";

export function useInsuranceRisk() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: insuranceKeys.risk(activeId ?? "none"),
    queryFn: () => insuranceApi.risk(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function usePolicies(f: PageFilter) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: insuranceKeys.policies(activeId ?? "none", f),
    queryFn: () => insuranceApi.policies(activeId as string, f),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

export function useClaims(f: PageFilter) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: insuranceKeys.claims(activeId ?? "none", f),
    queryFn: () => insuranceApi.claims(activeId as string, f),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

function useInvalidate() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: insuranceKeys.all(activeId) });
  };
}

export function useInsuranceActions() {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return {
    createPolicy: useMutation({
      mutationFn: (payload: { title: string; premium_cents: number; currency?: string }) =>
        insuranceApi.createPolicy(activeId as string, payload),
      onSuccess,
    }),
    fileClaim: useMutation({
      mutationFn: (payload: {
        policy_id: string;
        amount_cents: number;
        currency?: string;
        description?: string;
      }) => insuranceApi.fileClaim(activeId as string, payload),
      onSuccess,
    }),
    // A one-off computed premium quote — no persisted resource is created, so
    // there's nothing to invalidate; the result is shown from mutation state.
    quote: useMutation({
      mutationFn: (payload: { currency?: string } = {}) => insuranceApi.quote(activeId as string, payload),
    }),
  };
}

export function useClaimActions(id: string) {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return {
    decide: useMutation({
      mutationFn: (decision: string) => insuranceApi.decideClaim(activeId as string, id, decision),
      onSuccess,
    }),
  };
}
