import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { settingsApi } from "../api/settings.api";
import { settingsKeys } from "../api/settings.keys";

/** Members of the active organization (requires members.view on the backend). */
export function useMembers() {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: settingsKeys.members(activeId ?? "none"),
    queryFn: () => settingsApi.members(activeId as string),
    enabled: Boolean(activeId),
  });
}
