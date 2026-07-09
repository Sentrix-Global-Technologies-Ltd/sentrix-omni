import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { useResponders } from "../../responders/hooks/useResponders";
import { respondersApi } from "../../responders/api/responders.api";
import { profileKeys } from "../../responders/api/profile.keys";
import type { Responder } from "../../responders/api/responders.types";
import type { Certification } from "../../responders/api/profile.types";

/**
 * Org-wide roster. Responders are still capped at 100 per page (the
 * backend's per-page max on `responders.index`) — a true "every responder"
 * endpoint would need cursor pagination if an org ever exceeds that, but the
 * shifts feed below no longer needs one request per responder to build.
 */
export function useRosterResponders() {
  return useResponders({ perPage: 100 });
}

/**
 * Org-wide shifts for the roster calendar, via the aggregate `duty-shifts`
 * endpoint (one request, not a per-responder fan-out). Shifts are joined
 * against the already-fetched responder list locally by `responder_id`.
 */
export function useRosterShifts(responders: Responder[]) {
  const { activeId } = useOrganization();

  const query = useQuery({
    queryKey: profileKeys.orgShifts(activeId ?? "none"),
    queryFn: () => respondersApi.orgShifts(activeId as string),
    enabled: Boolean(activeId),
  });

  const shifts = useMemo(() => {
    const byResponderId = new Map(responders.map((r) => [r.id, r]));
    return (query.data?.data ?? []).flatMap((shift) => {
      const responder = byResponderId.get(shift.responder_id);
      return responder ? [{ shift, responder }] : [];
    });
  }, [query.data, responders]);

  return { shifts, isLoading: query.isLoading };
}

export function useRosterCertifications(responders: Responder[]) {
  const { activeId } = useOrganization();

  return useQueries({
    queries: responders.map((r) => ({
      queryKey: profileKeys.certs(activeId ?? "none", r.id),
      queryFn: () => respondersApi.certifications(activeId as string, r.id),
      enabled: Boolean(activeId),
    })),
    combine: (results) => ({
      certifications: results.flatMap((res, i) =>
        (res.data?.data ?? []).map((cert: Certification) => ({ cert, responder: responders[i] })),
      ),
      isLoading: results.some((r) => r.isLoading),
    }),
  });
}

/** Schedule or remove a shift for an arbitrary responder (picked in the UI, not fixed by route). */
export function useRosterActions() {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();

  const invalidate = (responderId: string) => {
    if (!activeId) return;
    queryClient.invalidateQueries({ queryKey: profileKeys.all(activeId, responderId) });
    // The org-wide aggregate lives in its own branch (not under responderId),
    // so a schedule/cancel from the Roster's own picker must invalidate it
    // explicitly too, or the calendar would show stale shifts.
    queryClient.invalidateQueries({ queryKey: profileKeys.orgShifts(activeId) });
  };

  return {
    schedule: useMutation({
      mutationFn: (vars: { responderId: string; starts_at: string; ends_at: string }) =>
        respondersApi.scheduleShift(activeId as string, vars.responderId, {
          starts_at: vars.starts_at,
          ends_at: vars.ends_at,
        }),
      onSuccess: (_data, vars) => invalidate(vars.responderId),
    }),
    remove: useMutation({
      mutationFn: (vars: { responderId: string; shiftId: string }) =>
        respondersApi.removeShift(activeId as string, vars.responderId, vars.shiftId),
      onSuccess: (_data, vars) => invalidate(vars.responderId),
    }),
  };
}
