import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { siteBridgesApi } from "../api/site-bridges.api";
import { siteBridgeKeys } from "../api/site-bridges.keys";

/**
 * This is an org-scoped action (bridges belong to one organization). `Can`
 * gates on the `bridges.manage` permission only — and SuperAdmin bypasses
 * every permission check client-side (see lib/principal.ts's hasPermission),
 * so a SuperAdmin browsing without an active organization (they have none —
 * SuperAdmin is a global, team-null role) can still see this action's button.
 * Without this guard, `activeId` would be `null` and the API layer's
 * template-literal URL would silently become `organizations/null/...`,
 * producing an opaque Postgres "invalid input syntax for type uuid: null"
 * error instead of a clear message. Platform staff provisioning a bridge on
 * a client's behalf should use the dedicated platform-scoped flow instead
 * (ProvisionBridgeButton on /superadmin), which takes an explicit
 * organization id/slug rather than relying on an active org context.
 */
function requireActiveOrganization(activeId: string | null): string {
  if (activeId === null) {
    throw new Error(
      "No organization is selected. Switch to an organization first, or use Sentrix Console → Provision Site Bridge to act on a client's behalf.",
    );
  }
  return activeId;
}

/** Onboard a new Site Bridge (returns a one-time bridge key). */
export function useOnboardBridge() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { label: string }) =>
      siteBridgesApi.onboard(requireActiveOrganization(activeId), payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: siteBridgeKeys.all(activeId) });
    },
  });
}

/** Bridge lifecycle actions (SuperAdmin/OrganizationAdmin-gated, bridges.manage). */
export function useSiteBridgeActions(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  const onSuccess = () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: siteBridgeKeys.all(activeId) });
  };

  return {
    activate: useMutation({
      mutationFn: () => siteBridgesApi.activate(requireActiveOrganization(activeId), id),
      onSuccess,
    }),
    suspend: useMutation({
      mutationFn: () => siteBridgesApi.suspend(requireActiveOrganization(activeId), id),
      onSuccess,
    }),
    revoke: useMutation({
      mutationFn: () => siteBridgesApi.revoke(requireActiveOrganization(activeId), id),
      onSuccess,
    }),
    rotateKey: useMutation({
      mutationFn: () => siteBridgesApi.rotateKey(requireActiveOrganization(activeId), id),
      onSuccess,
    }),
  };
}
