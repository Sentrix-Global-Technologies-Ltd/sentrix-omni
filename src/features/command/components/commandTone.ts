import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, humanize, titleCase } from "../../../lib/format";

export function cmdIncidentStatusTone(status: string): Tone {
  switch (status) {
    case "resolved":
    case "stood_down":
      return "success";
    case "on_scene":
    case "en_route":
      return "warning";
    case "acknowledged":
      return "info";
    case "new":
      return "error";
    default:
      return "light";
  }
}

export function severityTone(severity: string): Tone {
  switch (severity) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "light";
    default:
      return "light";
  }
}

export function agencyStatusTone(status: string): Tone {
  return status === "active" ? "success" : "light";
}

export const CMD_STATUS_OPTIONS: FilterOption[] = [
  { value: "new", label: "New" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "en_route", label: "En route" },
  { value: "on_scene", label: "On scene" },
  { value: "resolved", label: "Resolved" },
  { value: "stood_down", label: "Stood down" },
];

export const SEVERITY_OPTIONS: FilterOption[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const CATEGORY_OPTIONS: FilterOption[] = [
  { value: "crime", label: "Crime" },
  { value: "fire", label: "Fire" },
  { value: "traffic", label: "Traffic" },
  { value: "medical", label: "Medical" },
  { value: "disaster", label: "Disaster" },
  { value: "civil", label: "Civil" },
];

export const AGENCY_STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const TIER_OPTIONS: FilterOption[] = [
  { value: "national", label: "National" },
  { value: "state", label: "State" },
  { value: "zonal", label: "Zonal" },
  { value: "divisional", label: "Divisional" },
];

/** Actions an operator can apply to a command incident (backend `act` verb). */
export const ACT_OPTIONS: FilterOption[] = [
  { value: "acknowledge", label: "Acknowledge" },
  { value: "en_route", label: "En route" },
  { value: "on_scene", label: "On scene" },
  { value: "escalate", label: "Escalate" },
  { value: "resolve", label: "Resolve" },
  { value: "stand_down", label: "Stand down" },
];
