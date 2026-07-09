import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  OrgMember,
  Responder,
  ResponderAssignment,
  ResponderFilters,
} from "./responders.types";
import type { Certification, DutyShift, Skill } from "./profile.types";

const base = (orgId: string) => `organizations/${orgId}/responders`;

/** Endpoint module — thin, typed wrapper over the API client. No logic. */
export const respondersApi = {
  list(orgId: string, filters: ResponderFilters): Promise<ApiResult<Responder[]>> {
    return apiClient.get<Responder[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        assignable: filters.assignable || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    });
  },

  detail(orgId: string, id: string): Promise<ApiResult<Responder>> {
    return apiClient.get<Responder>(`${base(orgId)}/${id}`);
  },

  /** Org members eligible to be registered as a responder (the picker's source list). */
  orgMembers(orgId: string): Promise<ApiResult<OrgMember[]>> {
    return apiClient.get<OrgMember[]>(`organizations/${orgId}/members`);
  },

  /** Register an existing org member as a responder (responders.manage). */
  register(
    orgId: string,
    payload: { user_id: string; metadata?: Record<string, unknown> },
  ): Promise<ApiResult<Responder>> {
    return apiClient.post<Responder>(base(orgId), payload);
  },

  assignments(orgId: string, id: string): Promise<ApiResult<ResponderAssignment[]>> {
    return apiClient.get<ResponderAssignment[]>(`${base(orgId)}/${id}/assignments`);
  },

  // --- Status transition (server-confirmed; backend enforces guards) ---
  changeStatus(orgId: string, id: string, status: string): Promise<ApiResult<Responder>> {
    return apiClient.post<Responder>(`${base(orgId)}/${id}/status`, { status });
  },

  // --- Skills (org skill catalogue + responder's skills) ---
  skillCatalogue(orgId: string): Promise<ApiResult<Skill[]>> {
    return apiClient.get<Skill[]>(`organizations/${orgId}/skills`);
  },
  responderSkills(orgId: string, id: string): Promise<ApiResult<Skill[]>> {
    return apiClient.get<Skill[]>(`${base(orgId)}/${id}/skills`);
  },
  attachSkill(
    orgId: string,
    id: string,
    payload: { skill_id: string; proficiency?: string },
  ): Promise<ApiResult<Skill>> {
    return apiClient.post<Skill>(`${base(orgId)}/${id}/skills`, payload);
  },
  removeSkill(orgId: string, id: string, skillId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`${base(orgId)}/${id}/skills/${skillId}`);
  },

  // --- Certifications ---
  certifications(orgId: string, id: string): Promise<ApiResult<Certification[]>> {
    return apiClient.get<Certification[]>(`${base(orgId)}/${id}/certifications`);
  },
  addCertification(
    orgId: string,
    id: string,
    payload: { name: string; authority?: string; issued_at?: string; expires_at?: string },
  ): Promise<ApiResult<Certification>> {
    return apiClient.post<Certification>(`${base(orgId)}/${id}/certifications`, payload);
  },
  verifyCertification(orgId: string, id: string, certId: string): Promise<ApiResult<Certification>> {
    return apiClient.post<Certification>(`${base(orgId)}/${id}/certifications/${certId}/verify`);
  },

  // --- Duty shifts ---
  shifts(orgId: string, id: string): Promise<ApiResult<DutyShift[]>> {
    return apiClient.get<DutyShift[]>(`${base(orgId)}/${id}/shifts`);
  },
  /** Org-wide shifts across every responder (the Roster calendar) — one request instead of a per-responder fan-out. */
  orgShifts(orgId: string, params?: { from?: string; to?: string }): Promise<ApiResult<DutyShift[]>> {
    return apiClient.get<DutyShift[]>(`organizations/${orgId}/duty-shifts`, {
      query: { per_page: 100, from: params?.from, to: params?.to },
    });
  },
  scheduleShift(
    orgId: string,
    id: string,
    payload: { starts_at: string; ends_at: string },
  ): Promise<ApiResult<DutyShift>> {
    return apiClient.post<DutyShift>(`${base(orgId)}/${id}/shifts`, payload);
  },
  removeShift(orgId: string, id: string, shiftId: string): Promise<ApiResult<unknown>> {
    return apiClient.delete<unknown>(`${base(orgId)}/${id}/shifts/${shiftId}`);
  },
};
