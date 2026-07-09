import { Link } from "react-router";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import EmptyState from "../../../components/ui/state/EmptyState";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import { formatDateTime, humanize, lineTone } from "./responderTone";
import type { ResponderAssignment } from "../api/responders.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

interface Props {
  assignments: ResponderAssignment[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** A responder's assignment participation (current + history), linked to incidents. */
export default function ResponderAssignmentsPanel({
  assignments,
  isLoading,
  error,
  onRetry,
}: Props) {
  return (
    <div className={card}>
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
        Assignment participation
      </h3>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : assignments.length === 0 ? (
        <EmptyState title="No assignments yet" description="This responder hasn't been dispatched." />
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {humanize(a.role)}
                  </span>
                  <StatusBadge tone={lineTone(a.status)}>{humanize(a.status)}</StatusBadge>
                </div>
                {a.incident && (
                  <Link
                    to={`/incidents/${a.incident.id}`}
                    className="mt-1 block truncate text-theme-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {a.incident.title}
                  </Link>
                )}
                <p className="mt-0.5 text-theme-xs text-gray-400">
                  Offered {formatDateTime(a.offered_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
