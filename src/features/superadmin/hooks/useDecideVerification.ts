import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationsQueueApi } from "../api/verifications.api";
import type { DecideVerificationPayload } from "../api/verifications.types";

/** Approve/reject a 'manual'-driver KYC submission (Sentrix Console). */
export function useDecideVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DecideVerificationPayload }) =>
      verificationsQueueApi.decide(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "verifications"] });
    },
  });
}
