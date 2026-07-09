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
  /** Cursor (keyset) pagination token. */
  cursor?: string;
}
