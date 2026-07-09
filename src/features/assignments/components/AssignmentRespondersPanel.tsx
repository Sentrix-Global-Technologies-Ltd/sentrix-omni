import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import AddResponderAction from "./AddResponderAction";
import ResponderLineActions from "./ResponderLineActions";
import { formatDateTime, humanize, lineTone } from "./assignmentTone";
import type { AssignmentResponderLine } from "../api/assignments.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Responder lines for an assignment, with dispatch + per-line lifecycle actions. */
export default function AssignmentRespondersPanel({
  assignmentId,
  responders,
}: {
  assignmentId: string;
  responders: AssignmentResponderLine[];
}) {
  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Responder lines</h3>
        <AddResponderAction assignmentId={assignmentId} />
      </div>

      {responders.length === 0 ? (
        <EmptyState title="No responders assigned" description="Offer this assignment to a responder to get started." />
      ) : (
        <ul className="space-y-3">
          {responders.map((line) => (
            <li
              key={line.id}
              className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {humanize(line.role)}
                  </span>
                  <StatusBadge tone={lineTone(line.status)}>{humanize(line.status)}</StatusBadge>
                </div>
                <Link
                  to={`/responders/${line.responder_id}`}
                  className="mt-1 block truncate text-theme-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {line.responder_name ?? `Responder ${line.responder_id.slice(0, 8)}`}
                </Link>
                <p className="mt-0.5 text-theme-xs text-gray-400">
                  Offered {formatDateTime(line.offered_at)}
                  {line.on_scene_at ? ` · On scene ${formatDateTime(line.on_scene_at)}` : ""}
                </p>
              </div>
              <ResponderLineActions assignmentId={assignmentId} line={line} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
