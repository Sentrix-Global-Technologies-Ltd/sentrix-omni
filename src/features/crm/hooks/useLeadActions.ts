import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import { leadKeys } from "../api/leads.keys";
import type { CreateLeadInput } from "../api/leads.types";

/** Lead write actions (SuperAdmin). Invalidate the leads tree on success. */
export function useLeadActions(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: leadKeys.all() });

  return {
    changeStage: useMutation({
      mutationFn: (stage: string) => leadsApi.update(id, { stage }),
      onSuccess,
    }),
    convert: useMutation({
      mutationFn: () => leadsApi.convert(id),
      onSuccess,
    }),
    attachQuote: useMutation({
      mutationFn: (quote: Record<string, unknown>) => leadsApi.quote(id, quote),
      onSuccess,
    }),
  };
}

/**
 * Lead create (list-scoped — no id). Invalidates the leads query tree on
 * success so the new lead appears in the list.
 */
export function useLeadMutations() {
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: (data: CreateLeadInput) => leadsApi.create(data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all() }),
    }),
  };
}
