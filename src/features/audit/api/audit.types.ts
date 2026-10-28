/** Audit log types — mirror the backend AuditLogResource. */

export interface AuditSubject {
  type: string;
  id: string;
}

export interface AuditLog {
  id: string;
  action: string;
  organization_id: string;
  actor_id: string | null;
  actor_name?: string | null;
  subject: AuditSubject | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
}

export interface AuditFilters {
  action?: string;
  /** Chain-of-custody: scope the trail to one record (see
   * AuditLogController::SUBJECT_TYPES for the allowed subject_type aliases). */
  subject_type?: "observation" | "evidence_collection";
  subject_id?: string;
  /** Cursor (keyset) pagination token. */
  cursor?: string;
  /** Records per page — passed as per_page to the API (default 15, max 100). */
  per_page?: number;
}
