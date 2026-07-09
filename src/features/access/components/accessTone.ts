import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, humanize, titleCase } from "../../../lib/format";

export function passStatusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "success";
    case "revoked":
      return "error";
    default:
      return "light";
  }
}

export function gateResultTone(result: string): Tone {
  return result === "granted" ? "success" : "error";
}

export const PASS_STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "consumed", label: "Consumed" },
  { value: "revoked", label: "Revoked" },
];

export const GATE_RESULT_OPTIONS: FilterOption[] = [
  { value: "granted", label: "Granted" },
  { value: "denied", label: "Denied" },
];

export const GATE_DIRECTION_OPTIONS: FilterOption[] = [
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
];

export const PASS_TYPE_OPTIONS: FilterOption[] = [
  { value: "single", label: "Single-use" },
  { value: "recurring", label: "Recurring" },
  { value: "domestic", label: "Domestic" },
];
