/** Settings types — organization + members (mirror backend resources). */

export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string | null;
  /** Free-text jurisdiction (state/region) — matched against a Command area for agency oversight. */
  region: string | null;
  /** The state-tier Command node this org is auto-linked to, or null if unmapped. Read-only here. */
  command_id: string | null;
  members_count?: number;
  created_at: string | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  roles: string[];
  joined_at: string | null;
}

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  expires_at: string | null;
  accepted_at: string | null;
}

/** Assignable organization roles (seeded per-org; mirror OrganizationRole enum). */
export const ORG_ROLES = ["OrganizationAdmin", "Supervisor", "Dispatcher", "Responder", "User"] as const;
