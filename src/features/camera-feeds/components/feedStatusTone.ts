import type { Tone } from "../../../components/ui/tone";
import type { FeedStatus } from "../api/camera-feeds.types";

export { relativeTime, titleCase } from "../../../lib/format";

/** feed_status is derived from last_frame_at recency — see CameraSourceResource. */
export function feedStatusTone(status: FeedStatus): Tone {
  switch (status) {
    case "live":
      return "success";
    case "stale":
      return "warning";
    case "offline":
      return "error";
    case "no_feed":
      return "light";
    default:
      return "light";
  }
}

export function feedStatusLabel(status: FeedStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "stale":
      return "Stale";
    case "offline":
      return "Offline";
    case "no_feed":
      return "No feed yet";
    default:
      return status;
  }
}
