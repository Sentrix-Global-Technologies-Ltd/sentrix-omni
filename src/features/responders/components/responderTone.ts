import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { Responder, ResponderStatus } from "../api/responders.types";

// Shared formatters (re-exported for this feature's components).
export { titleCase, humanize, formatDateTime, relativeTime } from "../../../lib/format";

export const responderStatusTone: Record<ResponderStatus, Tone> = {
  available: "success",
  engaged: "info",
  off_duty: "light",
  unavailable: "warning",
  suspended: "error",
};

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "available", label: "Available" },
  { value: "engaged", label: "Engaged" },
  { value: "off_duty", label: "Off duty" },
  { value: "unavailable", label: "Unavailable" },
  { value: "suspended", label: "Suspended" },
];

export const ASSIGNABLE_OPTIONS: FilterOption[] = [
  { value: "1", label: "Assignable only" },
];

/** Tone for an assignment-line status (shared shape with incidents). */
export function lineTone(status: string): Tone {
  if (["on_scene", "completed", "accepted"].includes(status)) return "success";
  if (status === "declined") return "error";
  if (status === "en_route") return "info";
  return "warning";
}

/**
 * Display label for a responder. The API exposes user_id (not a name); use a
 * metadata name when present, else a short id. (Backend nicety: add the user's
 * display name to ResponderResource.)
 */
export function responderLabel(responder: Responder): string {
  if (responder.user_name) return responder.user_name;
  const name =
    responder.metadata && typeof responder.metadata.name === "string"
      ? responder.metadata.name
      : null;
  return name ?? `Responder ${responder.id.slice(0, 8)}`;
}
