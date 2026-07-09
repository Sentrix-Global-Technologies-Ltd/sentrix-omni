import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import DriverActions from "./DriverActions";
import {
  driverAvailabilityTone,
  driverStageTone,
  formatDateTime,
  humanize,
} from "./ridesOpsTone";
import type { OpsDriver } from "../api/ridesops.types";

interface Props {
  drivers: OpsDriver[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Drivers / fleet table (read-only ops view). */
export default function DriverTable({ drivers, isLoading, error, onRetry }: Props) {
  const columns: Column<OpsDriver>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (d) => {
        const v = d.vehicle;
        const name = [v.make, v.model].filter(Boolean).join(" ");
        return (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{name || "—"}</p>
            {v.plate && <p className="mt-0.5 text-theme-xs text-gray-400">{v.plate}</p>}
          </div>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      render: (d) => <StatusBadge tone={driverStageTone(d.stage)}>{humanize(d.stage)}</StatusBadge>,
    },
    {
      key: "availability",
      header: "Availability",
      render: (d) => (
        <StatusBadge tone={driverAvailabilityTone(d.availability)}>{humanize(d.availability)}</StatusBadge>
      ),
    },
    {
      key: "trips",
      header: "Trips",
      render: (d) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">{d.trips_count ?? 0}</span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (d) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {d.rating_avg != null ? d.rating_avg.toFixed(1) : "—"}
        </span>
      ),
    },
    {
      key: "safety",
      header: "Safety",
      render: (d) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {d.fleet_safety_score ?? "—"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (d) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(d.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (d) => <DriverActions driver={d} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={drivers}
      rowKey={(d) => d.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No drivers"
      emptyDescription="No drivers match the current filters."
    />
  );
}
