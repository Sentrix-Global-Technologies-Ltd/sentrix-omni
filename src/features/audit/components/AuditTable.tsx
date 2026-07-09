import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import Badge from "../../../components/ui/badge/Badge";
import { formatDateTime, humanize } from "../../../lib/format";
import type { AuditLog } from "../api/audit.types";

interface Props {
  logs: AuditLog[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Read-only audit log table. */
export default function AuditTable({ logs, isLoading, error, onRetry }: Props) {
  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: "Action",
      render: (l) => (
        <Badge variant="light" color="light">
          {humanize(l.action)}
        </Badge>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (l) =>
        l.subject ? (
          <span className="text-gray-700 dark:text-gray-300">
            {l.subject.type} <span className="text-gray-400">#{l.subject.id.slice(0, 8)}</span>
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (l) => (
        <span className="text-gray-500 dark:text-gray-400">
          {l.actor_name ?? (l.actor_id ? l.actor_id.slice(0, 8) : "system")}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      render: (l) => (
        <span className="text-gray-500 dark:text-gray-400">{l.ip_address ?? "—"}</span>
      ),
    },
    {
      key: "time",
      header: "When",
      render: (l) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(l.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      rowKey={(l) => l.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No audit entries"
      emptyDescription="No audit activity matches the current filter."
    />
  );
}
