import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useAuthz } from "../../../hooks/useAuthz";
import { respondersApi } from "../api/responders.api";
import { responderKeys } from "../api/responders.keys";

/**
 * Org members, for the "register responder" picker. Deliberately unfiltered —
 * the backend already rejects (409) a member who's already a responder, and
 * ConfirmActionButton surfaces that message directly, so no client-side
 * dedup is needed against a (possibly paginated) responder list.
 *
 * Gated on `members.view` (via `can`), not just rendered conditionally by
 * <Can> — a Responder/Dispatcher can reach this page (responders.view) without
 * holding members.view, and hooks run regardless of what JSX ends up hiding,
 * so this component would otherwise fire a doomed, 403-ing request for them.
 */
export function useOrgMembersForResponderPicker() {
  const { activeId } = useOrganization();
  const { can } = useAuthz();
  const permitted = can("members.view");

  return useQuery({
    queryKey: [...responderKeys.all(activeId ?? "none"), "org-members"] as const,
    queryFn: () => respondersApi.orgMembers(activeId as string),
    enabled: Boolean(activeId) && permitted,
  });
}

/** Turn an existing org member into a dispatchable Responder record. */
export function useRegisterResponder() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { user_id: string; metadata?: Record<string, unknown> }) =>
      respondersApi.register(activeId as string, payload),
    onSuccess: () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: responderKeys.all(activeId) });
      }
    },
  });
}
