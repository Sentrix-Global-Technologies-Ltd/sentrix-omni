import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, titleCase, humanize } from "../../../lib/format";

/** Source lifecycle status → badge tone. */
export function sourceStatusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    case "revoked":
      return "error";
    default:
      return "light";
  }
}

/** Health label → tone (service computes "healthy" | "stale" | …). */
export function healthTone(health: string): Tone {
  switch (health) {
    case "healthy":
      return "success";
    case "stale":
      return "warning";
    case "silent":
      return "error";
    default:
      return "light";
  }
}

export const SOURCE_STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "revoked", label: "Revoked" },
];
