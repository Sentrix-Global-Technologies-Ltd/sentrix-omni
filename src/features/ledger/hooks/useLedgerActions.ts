import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ledgerApi } from "../api/ledger.api";
import { ledgerKeys } from "../api/ledger.keys";

/**
 * Ledger source lifecycle actions. Server-confirmed mutations that invalidate the
 * ledger query tree on success (sources list + stats refetch).
 */
export function useLedgerSourceActions(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all() });

  return {
    activate: useMutation({ mutationFn: () => ledgerApi.activate(id), onSuccess }),
    suspend: useMutation({ mutationFn: () => ledgerApi.suspend(id), onSuccess }),
    revoke: useMutation({ mutationFn: () => ledgerApi.revoke(id), onSuccess }),
    rotateKey: useMutation({ mutationFn: () => ledgerApi.rotateKey(id), onSuccess }),
  };
}

/** Onboard a new ledger source (returns a one-time ingest key). */
export function useLedgerOnboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; kind: string; product?: string }) =>
      ledgerApi.onboard(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all() }),
  });
}
