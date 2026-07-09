import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { accessApi } from "../api/access.api";
import { accessKeys } from "../api/access.keys";
import type { GateFilters, PassFilters } from "../api/access.types";

export function usePasses(filters: PassFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: accessKeys.passes(activeId ?? "none", filters),
    queryFn: () => accessApi.passes(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

export function useGateEvents(filters: GateFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: accessKeys.gate(activeId ?? "none", filters),
    queryFn: () => accessApi.gate(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
  });
}

function useInvalidate() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: accessKeys.all(activeId) });
  };
}

/** Issue a visitor pass. */
export function useIssuePass() {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: { visitor_name: string; type?: string; valid_until?: string }) =>
      accessApi.issuePass(activeId as string, payload),
    onSuccess,
  });
}

/** Revoke a single pass. */
export function usePassActions(id: string) {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return {
    revoke: useMutation({
      mutationFn: () => accessApi.revokePass(activeId as string, id),
      onSuccess,
    }),
  };
}

/** Scan a visitor pass code at the gate (gate.scan). */
export function useScanGate() {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: { code: string; gate?: string; direction?: string }) =>
      accessApi.scanGate(activeId as string, payload),
    onSuccess,
  });
}

/** Log a gate event manually, without a pass scan (gate.log). */
export function useLogGate() {
  const { activeId } = useOrganization();
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: (payload: {
      gate?: string;
      direction?: string;
      result?: string;
      visitor_name?: string;
    }) => accessApi.logGate(activeId as string, payload),
    onSuccess,
  });
}
