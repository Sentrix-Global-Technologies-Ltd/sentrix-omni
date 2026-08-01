import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import { severityTone, relativeTime } from "../../evidence/components/evidenceTone";
import type { RecentZoneEvent } from "../api/facility.types";

interface Props {
  events: RecentZoneEvent[];
}

/** Straight off detection_events (the Ingest pipeline's own persisted rows —
 * see FacilityMapController::index()), not a fabricated activity feed. */
export default function RecentZoneEvents({ events }: Props) {
  if (events.length === 0) {
    return <EmptyState title="No recent events" description="Detections from this site's cameras will appear here." />;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {events.map((e) => (
        <div key={e.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{e.summary ?? e.type ?? "Detection event"}</p>
            <p className="truncate text-theme-xs text-gray-400">
              {[e.site, e.zone].filter(Boolean).join(" · ") || "Unassigned location"} · {relativeTime(e.received_at)}
            </p>
          </div>
          <StatusBadge tone={severityTone(e.severity)}>{e.severity}</StatusBadge>
        </div>
      ))}
    </div>
  );
}
