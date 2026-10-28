import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import { formatDateTime, humanize, lineTone } from "./responderTone";
import type { ResponderAssignment } from "../api/responders.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const thClass =
  "pb-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-400";
const tdClass = "py-3 pr-4 text-sm text-gray-700 dark:text-gray-300";

interface Props {
  assignments: ResponderAssignment[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** A responder's assignment participation (current + history) as a table. */
export default function ResponderAssignmentsPanel({
  assignments,
  isLoading,
  error,
  onRetry,
}: Props) {
  return (
    <div className={card}>
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
        Assignment Participation
      </h3>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="This responder hasn't been dispatched."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className={thClass}>Role</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Incident</th>
                <th className={thClass}>Offered</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className={`${tdClass} font-medium text-gray-800 dark:text-white/90`}>
                    {humanize(a.role)}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge tone={lineTone(a.status)}>
                      {humanize(a.status)}
                    </StatusBadge>
                  </td>
                  <td className={tdClass}>
                    {a.incident ? (
                      <Link
                        to={`/incidents/${a.incident.id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        {a.incident.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-gray-400`}>
                    {formatDateTime(a.offered_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
