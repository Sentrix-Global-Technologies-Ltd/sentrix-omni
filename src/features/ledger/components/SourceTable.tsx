import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import SourceActions from "./SourceActions";
import { formatDateTime, relativeTime, sourceStatusTone, titleCase } from "./ledgerTone";
import type { LedgerSource } from "../api/ledger.types";

interface Props {
  sources: LedgerSource[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Ledger sources table (read-only). */
export default function SourceTable({ sources, isLoading, error, onRetry }: Props) {
  const columns: Column<LedgerSource>[] = [
    {
      key: "source",
      header: "Source",
      render: (s) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{s.name}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">{s.slug}</p>
        </div>
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (s) => <span className="text-gray-600 dark:text-gray-300">{s.product ?? "—"}</span>,
    },
    {
      key: "kind",
      header: "Kind",
      render: (s) => <span className="text-gray-600 dark:text-gray-300">{titleCase(s.kind)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge tone={sourceStatusTone(s.status)}>{titleCase(s.status)}</StatusBadge>,
    },
    {
      key: "writes",
      header: "Writes",
      render: (s) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {s.write_count.toLocaleString()}
        </span>
      ),
    },
    {
      key: "last_write",
      header: "Last write",
      render: (s) => (
        <span className="text-gray-500 dark:text-gray-400">{relativeTime(s.last_write_at)}</span>
      ),
    },
    {
      key: "created",
      header: "Onboarded",
      render: (s) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(s.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (s) => <SourceActions source={s} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sources}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No sources"
      emptyDescription="No ledger sources match the current filters."
    />
  );
}
