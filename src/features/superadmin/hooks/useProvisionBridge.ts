import { useMutation } from "@tanstack/react-query";
import { platformBridgesApi } from "../api/platform-bridges.api";

/** Onboard a Site Bridge for a client org on their behalf (Sentrix Console). */
export function useProvisionBridge() {
  return useMutation({
    mutationFn: (payload: { organization_id: string; label: string }) =>
      platformBridgesApi.onboard(payload),
  });
}
