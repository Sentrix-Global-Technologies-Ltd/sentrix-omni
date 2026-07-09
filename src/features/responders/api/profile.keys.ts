/**
 * Query keys for a responder's profile sub-resources (skills/certs/shifts).
 * Shared between the per-responder profile panels and the org-wide roster
 * aggregation, so a mutation from either place invalidates both consistently.
 */
export const profileKeys = {
  all: (orgId: string, responderId: string) =>
    ["responder-profile", orgId, responderId] as const,
  skills: (orgId: string, responderId: string) =>
    ["responder-profile", orgId, responderId, "skills"] as const,
  certs: (orgId: string, responderId: string) =>
    ["responder-profile", orgId, responderId, "certs"] as const,
  shifts: (orgId: string, responderId: string) =>
    ["responder-profile", orgId, responderId, "shifts"] as const,
  /** Org-wide shift aggregate (Roster calendar) — GET duty-shifts. */
  orgShifts: (orgId: string) => ["responder-profile", orgId, "org-shifts"] as const,
};
