import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import PassActions from "./PassActions";
import { formatDateTime, passStatusTone, titleCase } from "./accessTone";
import type { Pass } from "../api/access.types";

interface Props {
  passes: Pass[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Visitor passes table. */
export default function PassTable({ passes, isLoading, error, onRetry }: Props) {
  const columns: Column<Pass>[] = [
    {
      key: "visitor",
      header: "Visitor",
      render: (p) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{p.visitor_name ?? "—"}</p>
          <p className="mt-0.5 font-mono text-theme-xs text-gray-400">{p.code}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (p) => <span className="text-gray-600 dark:text-gray-300">{titleCase(p.type)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge tone={passStatusTone(p.status)}>{titleCase(p.status)}</StatusBadge>,
    },
    {
      key: "valid",
      header: "Valid until",
      render: (p) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(p.valid_until)}</span>
      ),
    },
    {
      key: "uses",
      header: "Uses",
      render: (p) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">{p.uses_count}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (p) => <PassActions pass={p} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={passes}
      rowKey={(p) => p.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No passes"
      emptyDescription="No visitor passes match the current filters."
    />
  );
}
