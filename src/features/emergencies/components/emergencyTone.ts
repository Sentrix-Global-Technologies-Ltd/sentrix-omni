import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { EmergencySeverity, EmergencyStatus } from "../api/emergencies.types";

// Shared formatters (re-exported for this feature's components).
export { titleCase, humanize, formatDateTime } from "../../../lib/format";

export const emergencyStatusTone: Record<EmergencyStatus, Tone> = {
  triggered: "error",
  acknowledged: "warning",
  resolved: "success",
  cancelled: "light",
};

export const emergencySeverityTone: Record<EmergencySeverity, Tone> = {
  low: "light",
  medium: "info",
  high: "warning",
  critical: "error",
};

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "triggered", label: "Triggered" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];

export const SEVERITY_OPTIONS: FilterOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function emergencyLabel(message: string | null, id: string): string {
  const trimmed = message?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `Emergency ${id.slice(0, 8)}`;
}
