import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { respondersApi } from "../api/responders.api";
import { profileKeys } from "../api/profile.keys";

export function useResponderSkills(id: string) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: profileKeys.skills(activeId ?? "none", id),
    queryFn: () => respondersApi.responderSkills(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}

export function useSkillCatalogue() {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: ["responder-profile", activeId ?? "none", "skill-catalogue"],
    queryFn: () => respondersApi.skillCatalogue(activeId as string),
    enabled: Boolean(activeId),
  });
}

export function useResponderCertifications(id: string) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: profileKeys.certs(activeId ?? "none", id),
    queryFn: () => respondersApi.certifications(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}

export function useResponderShifts(id: string) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: profileKeys.shifts(activeId ?? "none", id),
    queryFn: () => respondersApi.shifts(activeId as string, id),
    enabled: Boolean(activeId) && Boolean(id),
  });
}

/** Invalidate all profile sub-resources for one responder. */
function useProfileInvalidate(id: string) {
  const { activeId } = useOrganization();
  const queryClient = useQueryClient();
  return () => {
    if (activeId) queryClient.invalidateQueries({ queryKey: profileKeys.all(activeId, id) });
  };
}

export function useSkillActions(id: string) {
  const { activeId } = useOrganization();
  const onSuccess = useProfileInvalidate(id);
  return {
    attach: useMutation({
      mutationFn: (payload: { skill_id: string; proficiency?: string }) =>
        respondersApi.attachSkill(activeId as string, id, payload),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (skillId: string) => respondersApi.removeSkill(activeId as string, id, skillId),
      onSuccess,
    }),
  };
}

export function useCertActions(id: string) {
  const { activeId } = useOrganization();
  const onSuccess = useProfileInvalidate(id);
  return {
    add: useMutation({
      mutationFn: (payload: { name: string; authority?: string; issued_at?: string; expires_at?: string }) =>
        respondersApi.addCertification(activeId as string, id, payload),
      onSuccess,
    }),
    verify: useMutation({
      mutationFn: (certId: string) => respondersApi.verifyCertification(activeId as string, id, certId),
      onSuccess,
    }),
  };
}

export function useShiftActions(id: string) {
  const { activeId } = useOrganization();
  const onSuccess = useProfileInvalidate(id);
  return {
    schedule: useMutation({
      mutationFn: (payload: { starts_at: string; ends_at: string }) =>
        respondersApi.scheduleShift(activeId as string, id, payload),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (shiftId: string) => respondersApi.removeShift(activeId as string, id, shiftId),
      onSuccess,
    }),
  };
}
