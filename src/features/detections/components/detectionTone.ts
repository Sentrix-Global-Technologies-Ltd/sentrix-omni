import type { Tone } from "../../../components/ui/tone";
import type { DetectionSeverity } from "../api/detections.types";

export { titleCase, relativeTime } from "../../../lib/format";

/** Domain severity → shared Badge tone, same convention as incidentSeverityTone. */
export const detectionSeverityTone: Record<DetectionSeverity, Tone> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "light",
  info: "light",
};
