import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, humanize, relativeTime } from "../../../lib/format";

export function supportTicketStatusTone(status: string): Tone {
  switch (status) {
    case "open":
      return "info";
    case "in_progress":
      return "warning";
    case "resolved":
      return "success";
    case "closed":
      return "light";
    default:
      return "light";
  }
}

export const SUPPORT_TICKET_STATUS_OPTIONS: FilterOption[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

/** Mirrors the backend's SupportTicketCategory enum exactly. */
export const SUPPORT_TICKET_CATEGORY_OPTIONS: FilterOption[] = [
  { value: "incident_emergency_workflow", label: "Incident / Emergency Workflow" },
  { value: "assignments_dispatch", label: "Assignments & Dispatch" },
  { value: "hardware_site_bridge", label: "Hardware & Site Bridge" },
  { value: "account_access", label: "Account & Access" },
  { value: "billing", label: "Billing" },
  { value: "bug_technical_issue", label: "Bug / Technical Issue" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];
