import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import ViewRowAction from "../../../components/ui/table/ViewRowAction";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { assignmentStatusTone, formatDateTime, humanize } from "./assignmentTone";
import type { Assignment } from "../api/assignments.types";

interface Props {
  assignments: Assignment[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (assignment: Assignment) => void;
}

/** Assignment list table — supplies columns to the shared DataTable. */
export default function AssignmentTable({
  assignments,
  isLoading,
  error,
  onRetry,
  onRowClick,
}: Props) {
  const columns: Column<Assignment>[] = [
    {
      key: "assignment",
      header: "Assignment",
      render: (a) => (
        <p className="font-medium text-gray-800 dark:text-white/90">
          {a.id.slice(0, 8)}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <StatusBadge tone={assignmentStatusTone[a.status]}>
          {humanize(a.status)}
        </StatusBadge>
      ),
    },
    {
      key: "responders",
      header: "Responders",
      render: (a) => (
        <span className="text-gray-600 dark:text-gray-300">
          {(a.responders?.length ?? 0)} / {a.required_primary + a.required_supporting}
        </span>
      ),
    },
    {
      key: "escalation",
      header: "Escalation",
      render: (a) => (
        <span className="text-gray-600 dark:text-gray-300">L{a.escalation_level}</span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (a) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDateTime(a.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (a) => <ViewRowAction to={`/assignments/${a.id}`} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={assignments}
      rowKey={(a) => a.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No assignments"
      emptyDescription="No assignments match the current filters."
    />
  );
}
