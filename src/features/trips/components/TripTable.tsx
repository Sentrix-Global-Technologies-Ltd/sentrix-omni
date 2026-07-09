import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, titleCase, tripStatusTone } from "./tripTone";
import type { Trip } from "../api/trips.types";

interface Props {
  trips: Trip[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (trip: Trip) => void;
}

export default function TripTable({ trips, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<Trip>[] = [
    {
      key: "route",
      header: "Route",
      render: (t) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{t.origin.label ?? "—"}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">→ {t.destination.label ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge tone={tripStatusTone(t.status)}>{titleCase(t.status)}</StatusBadge>,
    },
    {
      key: "started",
      header: "Started",
      render: (t) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(t.started_at)}</span>,
    },
    {
      key: "eta",
      header: "Expected",
      render: (t) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(t.expected_arrival_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={trips}
      rowKey={(t) => t.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No trips"
      emptyDescription="No trips match the current filters."
    />
  );
}
