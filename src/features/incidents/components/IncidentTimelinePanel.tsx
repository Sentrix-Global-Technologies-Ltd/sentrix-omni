import Timeline, { type TimelineItem } from "../../../components/ui/timeline/Timeline";
import EmptyState from "../../../components/ui/state/EmptyState";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, humanize } from "./incidentTone";
import type { TimelineEntry } from "../api/incidents.types";

function entryTone(type: string): Tone {
  if (type.includes("escalat")) return "error";
  if (type.includes("resolv")) return "success";
  if (type.includes("open")) return "warning";
  if (type.includes("clos")) return "light";
  return "info";
}

/**
 * Assignment event types that represent significant milestones for the
 * incident's chronological progression. These appear in the Incident Timeline
 * even though they originate in the assignment domain.
 */
const INCIDENT_TIMELINE_MILESTONE_TYPES = new Set([
  "assignment.created",
  "assignment.completed",
  "assignment.cancelled",
  "assignment.dispatch_escalated",
]);

/**
 * Filter entries to those meaningful for incident-level history:
 * - All incident-domain events (source === 'incident')
 * - Assignment milestones that explain incident progression
 *
 * Granular responder lifecycle events (offered, accepted, en_route, …) are
 * shown in the Response Log instead, where actor identity can be resolved.
 */
function isIncidentTimelineEntry(entry: TimelineEntry): boolean {
  return entry.source === "incident" || INCIDENT_TIMELINE_MILESTONE_TYPES.has(entry.type);
}

/** Maps incident timeline entries to the shared Timeline. */
export default function IncidentTimelinePanel({
  entries,
}: {
  entries: TimelineEntry[];
}) {
  const filtered = entries.filter(isIncidentTimelineEntry);

  if (filtered.length === 0) {
    return <EmptyState title="No timeline entries yet" />;
  }

  const items: TimelineItem[] = filtered.map((entry, index) => ({
    id: `${entry.at ?? "na"}-${index}`,
    time: formatDateTime(entry.at),
    title: humanize(entry.type),
    tone: entryTone(entry.type),
    description: entry.source ? (
      <span className="text-theme-xs uppercase tracking-wide text-gray-400">
        {entry.source}
      </span>
    ) : undefined,
  }));

  return <Timeline items={items} compact />;
}
