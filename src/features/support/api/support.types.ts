/** Support ticket types — mirror the backend SupportTicketResource. */

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type SupportTicketCategory =
  | "incident_emergency_workflow"
  | "assignments_dispatch"
  | "hardware_site_bridge"
  | "account_access"
  | "billing"
  | "bug_technical_issue"
  | "feature_request"
  | "other";

/** Which surface a ticket was submitted from — set server-side, never editable. */
export type SupportTicketSource = "mobile" | "dashboard";

export interface SupportTicket {
  id: string;
  // Null for consumer/mobile tickets — they aren't tied to any organization.
  organization_id: string | null;
  organization?: { id: string; name: string } | null;
  source: SupportTicketSource;
  source_label: string;
  submitted_by: string;
  submitter?: { id: string; name: string; email: string };
  title: string;
  description: string;
  category: SupportTicketCategory;
  category_label: string;
  other_category: string | null;
  screenshot_url: string | null;
  status: SupportTicketStatus;
  resolution_notes: string | null;
  assigned_to: string | null;
  assignee?: { id: string; name: string } | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface SupportTicketFilters {
  status?: string;
  page?: number;
}

export interface SubmitSupportTicketPayload {
  title: string;
  description: string;
  category: SupportTicketCategory;
  /** Required only when category === "other". */
  other_category?: string | null;
  screenshot?: File | null;
}
