import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, titleCase } from "../../../lib/format";

export function tripStatusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "success";
    case "overdue":
      return "error";
    case "completed":
      return "light";
    case "cancelled":
      return "light";
    default:
      return "light";
  }
}

export const TRIP_STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
