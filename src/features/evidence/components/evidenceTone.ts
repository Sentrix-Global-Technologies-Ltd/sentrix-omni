import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, humanize, titleCase } from "../../../lib/format";

export function severityTone(severity: string | null): Tone {
  switch (severity) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "light";
  }
}

export function retentionTone(tier: string): Tone {
  switch (tier) {
    case "hot":
      return "error";
    case "warm":
      return "warning";
    case "cold":
      return "info";
    default:
      return "light";
  }
}

export const KIND_OPTIONS: FilterOption[] = [
  { value: "face", label: "Face" },
  { value: "vehicle", label: "Vehicle" },
  { value: "plate", label: "Plate" },
  { value: "object", label: "Object" },
  { value: "scene", label: "Scene" },
  { value: "audio", label: "Audio" },
  { value: "behavior", label: "Behavior" },
  { value: "thermal", label: "Thermal" },
  { value: "sensor", label: "Sensor" },
];

export const SEVERITY_OPTIONS: FilterOption[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "hold", label: "On legal hold" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "sealed", label: "Sealed" },
];
