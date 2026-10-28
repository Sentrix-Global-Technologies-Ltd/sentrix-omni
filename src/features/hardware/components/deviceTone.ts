import type { Tone } from "../../../components/ui/tone";

export { formatDateTime, relativeTime, humanize, titleCase } from "../../../lib/format";

export function deviceStatusTone(status: string): Tone {
  switch (status) {
    case "online":
    case "active":
    case "healthy":
      return "success";
    case "degraded":
    case "stale":
      return "warning";
    case "offline":
    case "faulty":
    case "error":
      return "error";
    case "maintenance":
      return "warning";
    default:
      return "light";
  }
}
