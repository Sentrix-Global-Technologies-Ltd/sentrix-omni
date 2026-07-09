import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { formatDateTime, titleCase } from "./ledgerTone";
import type { LedgerWrite } from "../api/ledger.types";

interface Props {
  writes: LedgerWrite[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Ledger write activity table (read-only, append-only ledger). */
export default function WriteTable({ writes, isLoading, error, onRetry }: Props) {
  const columns: Column<LedgerWrite>[] = [
    {
      key: "type",
      header: "Type",
      render: (w) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{titleCase(w.type)}</span>
      ),
    },
    {
      key: "summary",
      header: "Summary",
      render: (w) => (
        <span className="text-gray-600 dark:text-gray-300">{w.summary ?? "—"}</span>
      ),
    },
    {
      key: "ref",
      header: "Reference",
      render: (w) => (
        <span className="font-mono text-theme-xs text-gray-500 dark:text-gray-400">
          {w.ref ?? "—"}
        </span>
      ),
    },
    {
      key: "recorded",
      header: "Recorded",
      render: (w) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(w.recorded_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={writes}
      rowKey={(w) => w.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No writes"
      emptyDescription="No ledger writes recorded yet."
    />
  );
}
