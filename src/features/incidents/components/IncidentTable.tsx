import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import ViewRowAction from "../../../components/ui/table/ViewRowAction";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import {
  formatDateTime,
  incidentSeverityTone,
  incidentStatusTone,
  riskTone,
  titleCase,
} from "./incidentTone";
import type { Incident } from "../api/incidents.types";

interface Props {
  incidents: Incident[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (incident: Incident) => void;
}

/** Incident list table — supplies columns to the shared DataTable. */
export default function IncidentTable({
  incidents,
  isLoading,
  error,
  onRetry,
  onRowClick,
}: Props) {
  const columns: Column<Incident>[] = [
    {
      key: "title",
      header: "Incident",
      render: (i) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{i.title}</p>
          {i.summary && (
            <p className="mt-0.5 line-clamp-1 text-theme-xs text-gray-400">
              {i.summary}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <StatusBadge tone={incidentStatusTone[i.status]}>
          {titleCase(i.status)}
        </StatusBadge>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (i) => (
        <StatusBadge tone={incidentSeverityTone[i.severity]}>
          {titleCase(i.severity)}
        </StatusBadge>
      ),
    },
    {
      key: "opened_at",
      header: "Opened",
      render: (i) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDateTime(i.opened_at)}
        </span>
      ),
    },
    {
      key: "risk_score",
      header: "Risk",
      // undefined = not eager-loaded on this view; null = loaded, no linked
      // detection (human-opened incident) — both render as a dash.
      render: (i) =>
        i.risk_score != null ? (
          <StatusBadge tone={riskTone(i.risk_score)}>{i.risk_score}</StatusBadge>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (i) => <ViewRowAction to={`/incidents/${i.id}`} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={incidents}
      rowKey={(i) => i.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No incidents"
      emptyDescription="No incidents match the current filters."
    />
  );
}
