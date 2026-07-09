import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, humanize, titleCase, formatNaira } from "../../../lib/format";

export function rideStatusTone(status: string): Tone {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    case "in_progress":
      return "primary";
    case "matched":
    case "arriving":
      return "warning";
    case "requested":
      return "info";
    default:
      return "light";
  }
}

export function driverAvailabilityTone(availability: string): Tone {
  switch (availability) {
    case "online":
      return "success";
    case "on_trip":
      return "warning";
    default:
      return "light";
  }
}

export function driverStageTone(stage: string): Tone {
  switch (stage) {
    case "active":
      return "success";
    case "rejected":
    case "suspended":
      return "error";
    case "vetting":
    case "documents_review":
    case "inspection_booked":
      return "warning";
    default:
      return "light";
  }
}

export const RIDE_STATUS_OPTIONS: FilterOption[] = [
  { value: "requested", label: "Requested" },
  { value: "matched", label: "Matched" },
  { value: "arriving", label: "Arriving" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const DRIVER_STAGE_OPTIONS: FilterOption[] = [
  { value: "documents_review", label: "Documents review" },
  { value: "documents_approved", label: "Documents approved" },
  { value: "inspection_booked", label: "Inspection booked" },
  { value: "vetting", label: "Vetting" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

export const DRIVER_AVAILABILITY_OPTIONS: FilterOption[] = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "on_trip", label: "On trip" },
];
