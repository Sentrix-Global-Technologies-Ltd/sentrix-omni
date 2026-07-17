import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supportQueueApi } from "../api/support-queue.api";
import type { TriageSupportTicketPayload } from "../api/support-queue.api";

/** Update status/resolution/assignment on a ticket (Sentrix Console). */
export function useTriageSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TriageSupportTicketPayload }) =>
      supportQueueApi.triage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "support-tickets"] });
    },
  });
}
