import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { dutyActionTone, formatDateTime, titleCase } from "./coordinationTone";
import type { DutyEntry } from "../api/coordination.types";

interface Props {
  entries: DutyEntry[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Append-only duty/sign-in book per control room — read-only ledger. */
export default function DutyBookTable({ entries, isLoading, error, onRetry }: Props) {
  const columns: Column<DutyEntry>[] = [
    {
      key: "person",
      header: "Person",
      render: (e) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{e.person_name}</p>
          {e.role && <p className="mt-0.5 text-theme-xs text-gray-400">{e.role}</p>}
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      render: (e) => (
        <span className="text-gray-600 dark:text-gray-300">
          {titleCase(e.scope_type)} · {e.scope_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (e) => <StatusBadge tone={dutyActionTone(e.action)}>{titleCase(e.action)}</StatusBadge>,
    },
    {
      key: "recorded",
      header: "Recorded",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(e.recorded_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      rowKey={(e) => e.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No duty entries"
      emptyDescription="No duty-book entries match the current filters."
    />
  );
}
