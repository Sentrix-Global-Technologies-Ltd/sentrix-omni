import type { ReactNode } from "react";
import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, humanize } from "./incidentTone";
import type { Assignment } from "../api/incidents.types";

function assignmentTone(status: string): Tone {
  if (status === "active" || status === "filled") return "success";
  if (status === "escalated") return "error";
  if (status === "cancelled" || status === "completed") return "light";
  return "info";
}

function lineTone(status: string): Tone {
  if (status === "on_scene" || status === "completed" || status === "accepted")
    return "success";
  if (status === "declined") return "error";
  if (status === "en_route") return "info";
  return "warning";
}

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]";

/**
 * Assignment panel for the incident detail page. Read-only once an assignment
 * exists (the assignment's own detail page owns its actions); when there is
 * none, renders an optional `action` slot (e.g. OpenAssignmentButton) so the
 * incident page can offer the one action that applies at this state.
 */
export default function IncidentAssignmentPanel({
  assignment,
  action,
}: {
  assignment: Assignment | null;
  action?: ReactNode;
}) {
  if (!assignment) {
    return (
      <div className={card}>
        <EmptyState
          title="No active assignment"
          description="No responders are currently assigned to this incident."
        />
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/assignments/${assignment.id}`}
          className="text-sm font-semibold text-gray-800 hover:text-brand-500 dark:text-white/90"
        >
          Assignment
        </Link>
        <StatusBadge tone={assignmentTone(assignment.status)}>
          {humanize(assignment.status)}
        </StatusBadge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-theme-xs uppercase text-gray-400">Required primary</dt>
          <dd className="text-gray-700 dark:text-gray-300">{assignment.required_primary}</dd>
        </div>
        <div>
          <dt className="text-theme-xs uppercase text-gray-400">Required supporting</dt>
          <dd className="text-gray-700 dark:text-gray-300">{assignment.required_supporting}</dd>
        </div>
        <div>
          <dt className="text-theme-xs uppercase text-gray-400">Escalation level</dt>
          <dd className="text-gray-700 dark:text-gray-300">{assignment.escalation_level}</dd>
        </div>
        <div>
          <dt className="text-theme-xs uppercase text-gray-400">Responders</dt>
          <dd className="text-gray-700 dark:text-gray-300">{assignment.responders.length}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h4 className="mb-2 text-theme-xs uppercase tracking-wide text-gray-400">
          Responder lines
        </h4>
        {assignment.responders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {assignment.responders.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {line.responder_name ?? `Responder ${line.responder_id.slice(0, 8)}`}{" "}
                    <span className="text-gray-400">· {humanize(line.role)}</span>
                  </p>
                  <p className="text-theme-xs text-gray-400">
                    {formatDateTime(line.accepted_at ?? line.offered_at)}
                  </p>
                </div>
                <StatusBadge tone={lineTone(line.status)}>
                  {humanize(line.status)}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
