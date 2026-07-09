import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, humanize, titleCase } from "../../../lib/format";

export function mutualAidStatusTone(status: string): Tone {
  switch (status) {
    case "accepted":
      return "success";
    case "declined":
    case "cancelled":
      return "error";
    case "requested":
      return "warning";
    default:
      return "light";
  }
}

export function taskingStatusTone(status: string): Tone {
  switch (status) {
    case "resolved":
      return "success";
    case "acknowledged":
      return "info";
    case "sent":
      return "warning";
    default:
      return "light";
  }
}

export function dutyActionTone(action: string): Tone {
  switch (action) {
    case "sign_in":
      return "success";
    case "sign_out":
      return "light";
    case "handover":
      return "info";
    default:
      return "light";
  }
}

export const MUTUAL_AID_STATUS_OPTIONS: FilterOption[] = [
  { value: "requested", label: "Requested" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export const TASKING_STATUS_OPTIONS: FilterOption[] = [
  { value: "sent", label: "Sent" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
];

export const TASKING_KIND_OPTIONS: FilterOption[] = [
  { value: "incident", label: "Incident" },
  { value: "sos", label: "SOS" },
  { value: "detection", label: "Detection" },
  { value: "general", label: "General" },
];

export const DUTY_SCOPE_OPTIONS: FilterOption[] = [
  { value: "center", label: "Monitoring centre" },
  { value: "client", label: "Client site" },
  { value: "command", label: "Command" },
];

export const DUTY_ACTION_OPTIONS: FilterOption[] = [
  { value: "sign_in", label: "Sign in" },
  { value: "sign_out", label: "Sign out" },
  { value: "handover", label: "Handover" },
];

export const MESSAGE_DIRECTION_OPTIONS: FilterOption[] = [
  { value: "dispatch_to_unit", label: "Dispatch → unit" },
  { value: "unit_to_dispatch", label: "Unit → dispatch" },
];
