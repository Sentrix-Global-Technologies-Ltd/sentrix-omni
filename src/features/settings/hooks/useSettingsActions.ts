import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { settingsApi } from "../api/settings.api";
import { settingsKeys } from "../api/settings.keys";

/** Invalidate every settings query under the active org after a write. */
function useOrgInvalidate() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: settingsKeys.org(activeId) });
  };
}

/**
 * Create a brand-new organization. Not currently wired to any button in this
 * app — tenant provisioning is a platform-staff action (organizations.provision:
 * OnboardingManager/SuperAdmin), not something an ordinary org member can
 * self-serve. Kept for a future platform-staff admin tool.
 */
export function useCreateOrganization() {
  return useMutation({
    mutationFn: (payload: { name: string; slug?: string; region?: string }) =>
      settingsApi.createOrganization(payload),
  });
}

/** Organization settings + owner-level actions. */
export function useOrganizationActions() {
  const { activeId } = useOrganization();
  const onSuccess = useOrgInvalidate();
  return {
    update: useMutation({
      mutationFn: (payload: { name?: string; slug?: string; region?: string | null }) =>
        settingsApi.updateOrganization(activeId as string, payload),
      onSuccess,
    }),
    transferOwnership: useMutation({
      mutationFn: (userId: string) =>
        settingsApi.transferOwnership(activeId as string, userId),
      onSuccess,
    }),
    // Deleting the active org leaves no tenant context; the caller re-bootstraps.
    deleteOrg: useMutation({
      mutationFn: () => settingsApi.deleteOrganization(activeId as string),
    }),
  };
}

/** Member actions for one member (requires members.update / members.remove). */
export function useMemberActions(userId: string) {
  const { activeId } = useOrganization();
  const onSuccess = useOrgInvalidate();
  return {
    changeRole: useMutation({
      mutationFn: (role: string) =>
        settingsApi.updateMemberRole(activeId as string, userId, role),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: () => settingsApi.removeMember(activeId as string, userId),
      onSuccess,
    }),
  };
}

/** Invitation actions (requires members.invite). */
export function useInvitationActions() {
  const { activeId } = useOrganization();
  const onSuccess = useOrgInvalidate();
  return {
    invite: useMutation({
      mutationFn: (payload: { email: string; role: string }) =>
        settingsApi.invite(activeId as string, payload),
      onSuccess,
    }),
    revoke: useMutation({
      mutationFn: (invitationId: string) =>
        settingsApi.revokeInvitation(activeId as string, invitationId),
      onSuccess,
    }),
  };
}
