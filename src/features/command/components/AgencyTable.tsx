import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { agencyStatusTone, formatDateTime, titleCase } from "./commandTone";
import type { Agency } from "../api/command.types";

interface Props {
  agencies: Agency[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Agencies table — read-only. */
export default function AgencyTable({ agencies, isLoading, error, onRetry }: Props) {
  const columns: Column<Agency>[] = [
    {
      key: "agency",
      header: "Agency",
      render: (a) => (
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-6 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: a.color ?? "#e5e7eb" }}
          />
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{a.name}</p>
            <p className="mt-0.5 text-theme-xs text-gray-400">{a.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (a) => <span className="text-gray-600 dark:text-gray-300">{a.country ?? "—"}</span>,
    },
    {
      key: "categories",
      header: "Categories",
      render: (a) => (
        <span className="text-gray-600 dark:text-gray-300">
          {a.categories?.length ? a.categories.map(titleCase).join(", ") : "—"}
        </span>
      ),
    },
    {
      key: "hotline",
      header: "Hotline",
      render: (a) => <span className="text-gray-600 dark:text-gray-300">{a.hotline ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <StatusBadge tone={agencyStatusTone(a.status)}>{titleCase(a.status)}</StatusBadge>,
    },
    {
      key: "created",
      header: "Created",
      render: (a) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(a.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={agencies}
      rowKey={(a) => a.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No agencies"
      emptyDescription="No agencies match the current filters."
    />
  );
}
