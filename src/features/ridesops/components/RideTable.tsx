import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import RideActions from "./RideActions";
import { formatDateTime, formatNaira, humanize, rideStatusTone } from "./ridesOpsTone";
import type { OpsRide } from "../api/ridesops.types";

interface Props {
  rides: OpsRide[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Rides table (read-only ops view). */
export default function RideTable({ rides, isLoading, error, onRetry }: Props) {
  const columns: Column<OpsRide>[] = [
    {
      key: "route",
      header: "Route",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.origin_label ?? "—"}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">→ {r.dest_label ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (r) => <span className="text-gray-600 dark:text-gray-300">{humanize(r.ride_class)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge tone={rideStatusTone(r.status)}>{humanize(r.status)}</StatusBadge>,
    },
    {
      key: "fare",
      header: "Fare",
      render: (r) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {formatNaira(r.final_fare_cents ?? r.fare_estimate_cents)}
        </span>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      render: (r) =>
        r.driver_name ? (
          <div>
            <p className="text-gray-700 dark:text-gray-200">{r.driver_name}</p>
            {r.driver_plate && <p className="mt-0.5 text-theme-xs text-gray-400">{r.driver_plate}</p>}
          </div>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        ),
    },
    {
      key: "requested",
      header: "Requested",
      render: (r) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(r.requested_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => <RideActions ride={r} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rides}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No rides"
      emptyDescription="No rides match the current filters."
    />
  );
}
