/** Responder profile sub-resources — skills, certifications, duty shifts. */

export interface Skill {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  /** Present only on a responder's attached skills (pivot). */
  proficiency?: string | null;
}

export interface Certification {
  id: string;
  responder_id: string;
  organization_id: string;
  name: string;
  authority: string | null;
  issued_at: string | null;
  expires_at: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface DutyShift {
  id: string;
  responder_id: string;
  organization_id: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  source: string | null;
  created_at: string | null;
}

export const SKILL_PROFICIENCY_OPTIONS = [
  { value: "trainee", label: "Trainee" },
  { value: "trained", label: "Trained" },
  { value: "expert", label: "Expert" },
];
