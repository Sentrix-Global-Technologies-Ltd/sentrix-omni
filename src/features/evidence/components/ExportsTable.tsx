import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import Badge from "../../../components/ui/badge/Badge";
import { formatDateTime } from "./evidenceTone";
import type { RetentionExport } from "../../retention/api/retention.types";

interface Props {
  exports: RetentionExport[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Append-only history of archive-first export manifests (see
 * RetentionService::archive — this table never mutates anything). */
export default function ExportsTable({ exports, isLoading, error, onRetry }: Props) {
  const columns: Column<RetentionExport>[] = [
    {
      key: "format",
      header: "Format",
      render: (e) => (
        <Badge variant="light" color="light">
          {e.format.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "count",
      header: "Observations",
      render: (e) => <span className="tabular-nums text-gray-600 dark:text-gray-300">{e.count}</span>,
    },
    {
      key: "exported_by",
      header: "Exported by",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">
          {e.exported_by ? e.exported_by.slice(0, 8) : "system"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Exported",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(e.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={exports}
      rowKey={(e) => e.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No exports yet"
      emptyDescription="Archive-first exports appear here once evidence is exported (Retention Policy tab)."
    />
  );
}
