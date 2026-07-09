import Timeline, { type TimelineItem } from "../../../components/ui/timeline/Timeline";
import EmptyState from "../../../components/ui/state/EmptyState";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, humanize } from "../../../lib/format";
import type { Incident } from "../../incidents/api/incidents.types";
import type { Emergency } from "../../emergencies/api/emergencies.types";
import type { Assignment } from "../../assignments/api/assignments.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function incidentTone(status: string): Tone {
  if (status === "escalated") return "error";
  if (status === "resolved" || status === "closed") return "success";
  return "warning";
}

function emergencyTone(status: string): Tone {
  if (status === "triggered") return "error";
  if (status === "resolved") return "success";
  return "info";
}

function assignmentTone(status: string): Tone {
  if (status === "escalated") return "error";
  if (status === "completed" || status === "active") return "success";
  return "info";
}

interface Props {
  incidents: Incident[];
  emergencies: Emergency[];
  assignments: Assignment[];
}

/**
 * Live activity timeline — merges the most recent items already fetched for
 * the incident/emergency/dispatch summaries into one feed on the shared
 * Timeline component (same mapping convention as IncidentTimelinePanel).
 * No extra API calls: it's a client-side merge of data the page already
 * holds, and it refreshes whenever those queries do (i.e. live, via the
 * feature realtime hooks mounted on the page).
 */
export default function ActivityTimelinePanel({ incidents, emergencies, assignments }: Props) {
  const items: (TimelineItem & { at: number })[] = [
    ...incidents.map((i) => ({
      id: `incident-${i.id}`,
      at: i.created_at ? new Date(i.created_at).getTime() : 0,
      time: formatDateTime(i.created_at),
      title: `Incident — ${i.title}`,
      tone: incidentTone(i.status),
      description: humanize(i.status),
    })),
    ...emergencies.map((e) => ({
      id: `emergency-${e.id}`,
      at: e.created_at ? new Date(e.created_at).getTime() : 0,
      time: formatDateTime(e.created_at),
      title: `Emergency — ${e.message?.trim() || e.id.slice(0, 8)}`,
      tone: emergencyTone(e.status),
      description: humanize(e.status),
    })),
    ...assignments.map((a) => ({
      id: `assignment-${a.id}`,
      at: a.updated_at ? new Date(a.updated_at).getTime() : 0,
      time: formatDateTime(a.updated_at),
      title: `Dispatch ${a.id.slice(0, 8)}`,
      tone: assignmentTone(a.status),
      description: humanize(a.status),
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return (
    <div className={card}>
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Live activity</h3>
      {items.length === 0 ? (
        <EmptyState title="No recent activity" />
      ) : (
        <Timeline items={items} />
      )}
    </div>
  );
}
