import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import ViewRowAction from "../../../components/ui/table/ViewRowAction";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import {
  emergencyLabel,
  emergencySeverityTone,
  emergencyStatusTone,
  formatDateTime,
  titleCase,
} from "./emergencyTone";
import type { Emergency } from "../api/emergencies.types";

interface Props {
  emergencies: Emergency[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (emergency: Emergency) => void;
}

/** Emergency list table — supplies columns to the shared DataTable. */
export default function EmergencyTable({
  emergencies,
  isLoading,
  error,
  onRetry,
  onRowClick,
}: Props) {
  const columns: Column<Emergency>[] = [
    {
      key: "emergency",
      header: "Emergency",
      render: (e) => (
        <p className="font-medium text-gray-800 dark:text-white/90">
          {emergencyLabel(e.message, e.id)}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <StatusBadge tone={emergencyStatusTone[e.status]}>
          {titleCase(e.status)}
        </StatusBadge>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (e) => (
        <StatusBadge tone={emergencySeverityTone[e.severity]}>
          {titleCase(e.severity)}
        </StatusBadge>
      ),
    },
    {
      key: "triggered_at",
      header: "Triggered",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDateTime(e.triggered_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) => <ViewRowAction to={`/emergencies/${e.id}`} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={emergencies}
      rowKey={(e) => e.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No emergencies"
      emptyDescription="No emergencies match the current filters."
    />
  );
}
