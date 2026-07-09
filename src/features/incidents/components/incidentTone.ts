import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { IncidentSeverity, IncidentStatus } from "../api/incidents.types";

/** Domain status/severity → shared Badge tone (the only place these map). */
export const incidentStatusTone: Record<IncidentStatus, Tone> = {
  open: "warning",
  investigating: "info",
  escalated: "error",
  resolved: "success",
  closed: "light",
};

export const incidentSeverityTone: Record<IncidentSeverity, Tone> = {
  low: "light",
  medium: "info",
  high: "warning",
  critical: "error",
};

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const SEVERITY_OPTIONS: FilterOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// Shared formatters (re-exported so existing imports from this module keep working).
export { titleCase, humanize, formatDateTime } from "../../../lib/format";
