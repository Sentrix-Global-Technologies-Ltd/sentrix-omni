import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { settingsApi } from "../api/settings.api";
import { settingsKeys } from "../api/settings.keys";

/** Pending/accepted invitations for the active org (requires members.view). */
export function useInvitations() {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: settingsKeys.invitations(activeId ?? "none"),
    queryFn: () => settingsApi.invitations(activeId as string),
    enabled: Boolean(activeId),
  });
}
