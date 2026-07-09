import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { AssignmentStatus } from "../api/assignments.types";

// Shared formatters (re-exported for this feature's components).
export { titleCase, humanize, formatDateTime } from "../../../lib/format";

export const assignmentStatusTone: Record<AssignmentStatus, Tone> = {
  pending: "light",
  dispatching: "info",
  partially_filled: "warning",
  filled: "info",
  active: "success",
  escalated: "error",
  completed: "light",
  cancelled: "light",
};

/** Tone for an assignment-line (responder) status. */
export function lineTone(status: string): Tone {
  if (["on_scene", "completed", "accepted"].includes(status)) return "success";
  if (status === "declined") return "error";
  if (status === "en_route") return "info";
  return "warning";
}

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "pending", label: "Pending" },
  { value: "dispatching", label: "Dispatching" },
  { value: "partially_filled", label: "Partially filled" },
  { value: "filled", label: "Filled" },
  { value: "active", label: "Active" },
  { value: "escalated", label: "Escalated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
