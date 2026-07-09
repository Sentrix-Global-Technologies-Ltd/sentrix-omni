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

/** Maps incident timeline entries to the shared Timeline. */
export default function IncidentTimelinePanel({
  entries,
}: {
  entries: TimelineEntry[];
}) {
  if (entries.length === 0) {
    return <EmptyState title="No timeline entries yet" />;
  }

  const items: TimelineItem[] = entries.map((entry, index) => ({
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

  return <Timeline items={items} />;
}
