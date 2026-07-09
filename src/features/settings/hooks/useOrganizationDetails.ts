import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { settingsApi } from "../api/settings.api";
import { settingsKeys } from "../api/settings.keys";

/** Active organization details (name, slug, members count, owner). */
export function useOrganizationDetails() {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: settingsKeys.organization(activeId ?? "none"),
    queryFn: () => settingsApi.organization(activeId as string),
    enabled: Boolean(activeId),
  });
}
