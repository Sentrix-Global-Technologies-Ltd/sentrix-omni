import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import TaskingActions from "./TaskingActions";
import { formatDateTime, taskingStatusTone, titleCase } from "./coordinationTone";
import type { Tasking } from "../api/coordination.types";

interface Props {
  taskings: Tasking[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** HQ duty taskings — sent to an assignee, acknowledged, resolved. */
export default function TaskingTable({ taskings, isLoading, error, onRetry }: Props) {
  const columns: Column<Tasking>[] = [
    {
      key: "title",
      header: "Tasking",
      render: (t) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{t.title}</p>
          {t.ref && <p className="mt-0.5 text-theme-xs text-gray-400">{t.ref}</p>}
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (t) => <span className="text-gray-600 dark:text-gray-300">{titleCase(t.kind)}</span>,
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (t) => (
        <span className="text-gray-600 dark:text-gray-300">{t.assignee ? t.assignee.slice(0, 8) : "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge tone={taskingStatusTone(t.status)}>{titleCase(t.status)}</StatusBadge>,
    },
    {
      key: "created",
      header: "Routed",
      render: (t) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(t.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (t) => <TaskingActions tasking={t} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={taskings}
      rowKey={(t) => t.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No taskings"
      emptyDescription="No taskings match the current filters."
    />
  );
}
