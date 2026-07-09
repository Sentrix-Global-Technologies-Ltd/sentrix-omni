import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import ViewRowAction from "../../../components/ui/table/ViewRowAction";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import {
  humanize,
  relativeTime,
  responderLabel,
  responderStatusTone,
} from "./responderTone";
import type { Responder } from "../api/responders.types";

interface Props {
  responders: Responder[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (responder: Responder) => void;
}

/** Responder roster table — supplies columns to the shared DataTable. */
export default function ResponderTable({
  responders,
  isLoading,
  error,
  onRetry,
  onRowClick,
}: Props) {
  const columns: Column<Responder>[] = [
    {
      key: "responder",
      header: "Responder",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {responderLabel(r)}
          </p>
          <p className="mt-0.5 text-theme-xs text-gray-400">
            {r.user_email ?? r.id.slice(0, 8)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge tone={responderStatusTone[r.status]}>
          {humanize(r.status)}
        </StatusBadge>
      ),
    },
    {
      key: "duty",
      header: "Duty",
      render: (r) => (
        <span className="text-gray-600 dark:text-gray-300">
          {r.on_duty ? "On duty" : "Off"}
        </span>
      ),
    },
    {
      key: "assignable",
      header: "Assignable",
      render: (r) => (
        <StatusBadge tone={r.assignable ? "success" : "light"}>
          {r.assignable ? "Yes" : "No"}
        </StatusBadge>
      ),
    },
    {
      key: "last_seen",
      header: "Last seen",
      render: (r) => (
        <span className="text-gray-500 dark:text-gray-400">
          {relativeTime(r.last_seen_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => <ViewRowAction to={`/responders/${r.id}`} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={responders}
      rowKey={(r) => r.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No responders"
      emptyDescription="No responders match the current filters."
    />
  );
}
