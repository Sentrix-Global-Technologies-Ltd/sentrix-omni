import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { supportApi } from "../api/support.api";
import { supportKeys } from "../api/support.keys";
import type { SubmitSupportTicketPayload } from "../api/support.types";

/**
 * Same guard as useSiteBridgeActions' requireActiveOrganization: SuperAdmin
 * bypasses every client-side permission check (see lib/principal.ts) and can
 * reach any nav-visible page, including this one, without an active
 * organization (SuperAdmin is a global, team-null role). Without this guard,
 * `activeId` would be `null` and the API layer's template-literal URL would
 * silently become `organizations/null/...`, producing an opaque Postgres
 * "invalid input syntax for type uuid: null" error instead of a clear message.
 */
function requireActiveOrganization(activeId: string | null): string {
  if (activeId === null) {
    throw new Error("No organization is selected. Switch to an organization first to contact support.");
  }
  return activeId;
}

/** Submit a new support ticket for the active organization. */
export function useSubmitSupportTicket() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitSupportTicketPayload) =>
      supportApi.submit(requireActiveOrganization(activeId), payload),
    onSuccess: () => {
      if (activeId) queryClient.invalidateQueries({ queryKey: supportKeys.all(activeId) });
    },
  });
}
