import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import DeviceActions from "./DeviceActions";
import { deviceStatusTone, humanize, relativeTime, titleCase } from "./deviceTone";
import type { Device } from "../api/hardware.types";

interface Props {
  devices: Device[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Device fleet table. */
export default function DeviceTable({ devices, isLoading, error, onRetry }: Props) {
  const columns: Column<Device>[] = [
    {
      key: "device",
      header: "Device",
      render: (d) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{d.name ?? d.serial}</p>
          <p className="mt-0.5 font-mono text-theme-xs text-gray-400">{d.serial}</p>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (d) => <span className="text-gray-600 dark:text-gray-300">{humanize(d.kind)}</span>,
    },
    {
      key: "location",
      header: "Location",
      render: (d) => (
        <span className="text-gray-600 dark:text-gray-300">
          {[d.site, d.zone].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge tone={deviceStatusTone(d.status)}>{titleCase(d.status)}</StatusBadge>,
    },
    {
      key: "last_seen",
      header: "Last seen",
      render: (d) => (
        <span className="text-gray-500 dark:text-gray-400">{relativeTime(d.last_seen_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (d) => <DeviceActions device={d} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={devices}
      rowKey={(d) => d.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No devices"
      emptyDescription="No hardware devices are registered for this organization."
    />
  );
}
