/** CRM lead types — mirror the backend LeadResource (platform/SuperAdmin). */

export type LeadStage = "new" | "qualified" | "quoted" | "won" | "lost";
export type ClientType = "university" | "estate" | "company" | "other";

export interface Lead {
  id: string;
  name: string;
  client_type: ClientType;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  region: string | null;
  source: string | null;
  stage: LeadStage;
  quote: Record<string, unknown> | null;
  notes: string | null;
  converted_organization_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadFilters {
  stage?: string;
  client_type?: string;
  page?: number;
  /** e.g. `1` to cheaply read `meta.total` without pulling a full page. */
  per_page?: number;
}

/** `POST leads` payload (mirrors CreateLeadRequest). */
export interface CreateLeadInput {
  name: string;
  client_type: ClientType;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  region?: string;
  source?: string;
  notes?: string;
}
