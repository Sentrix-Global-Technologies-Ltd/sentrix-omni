import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { respondersApi } from "../api/responders.api";
import { responderKeys } from "../api/responders.keys";

/** Responder detail (status + current assignment). */
export function useResponder(id: string) {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: responderKeys.detail(activeId ?? "none", id),
    queryFn: () => respondersApi.detail(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}
