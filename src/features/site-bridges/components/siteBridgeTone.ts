import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";

export { formatDateTime, relativeTime, titleCase } from "../../../lib/format";

/** Health is derived (last_seen_at vs. status) — see CameraBridgeResource. */
export function bridgeHealthTone(health: string): Tone {
  switch (health) {
    case "healthy":
      return "success";
    case "idle":
      return "light";
    case "stale":
      return "warning";
    case "suspended":
      return "warning";
    case "offline":
      return "error";
    case "pending":
      return "info";
    default:
      return "light";
  }
}

export const BRIDGE_STATUS_OPTIONS: FilterOption[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "revoked", label: "Revoked" },
];
