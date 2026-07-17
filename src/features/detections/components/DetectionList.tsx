import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import EmptyState from "../../../components/ui/state/EmptyState";
import { detectionSeverityTone, relativeTime, titleCase } from "./detectionTone";
import { humanize } from "../../../lib/format";
import type { DetectionEvent } from "../api/detections.types";

interface Props {
  detections: DetectionEvent[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Plain-text recent-detections list — the "cheap, honest" half of the Camera
 * Wall (health tiles are the other half). Deliberately no bounding-box
 * overlay or frame annotation: the backend has no stored coordinates tied to
 * a specific frame, so a text line per detection is what the data actually
 * supports. */
export default function DetectionList({ detections, isLoading, error, onRetry }: Props) {
  const hasError = error !== null && error !== undefined;

  if (isLoading) return <LoadingState label="Loading recent detections…" />;
  if (hasError) return <ErrorState error={error} onRetry={onRetry} />;
  if (detections.length === 0) {
    return (
      <EmptyState
        title="No recent detections"
        description="Detections from the Ingest pipeline (camera, vision, or signal) will appear here as they arrive."
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {detections.map((d) => (
        <li key={d.id} className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-theme-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-gray-800 dark:text-white/90">{humanize(d.type)}</span>
              {" — "}
              {[d.site, d.zone].filter(Boolean).join(" · ") || "Unknown location"}
              {" · risk "}
              {d.risk_score}
            </p>
            <p className="mt-0.5 text-theme-xs text-gray-400">
              {relativeTime(d.received_at)}
              {d.incident_id && (
                <>
                  {" · "}
                  <Link to={`/incidents/${d.incident_id}`} className="text-brand-500 hover:text-brand-600">
                    View incident
                  </Link>
                </>
              )}
            </p>
          </div>
          <StatusBadge tone={detectionSeverityTone[d.severity]}>{titleCase(d.severity)}</StatusBadge>
        </li>
      ))}
    </ul>
  );
}
