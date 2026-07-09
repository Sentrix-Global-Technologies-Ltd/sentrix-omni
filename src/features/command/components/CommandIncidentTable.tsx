import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import CommandIncidentActions from "./CommandIncidentActions";
import {
  cmdIncidentStatusTone,
  formatDateTime,
  humanize,
  severityTone,
  titleCase,
} from "./commandTone";
import type { CmdIncident } from "../api/command.types";

interface Props {
  incidents: CmdIncident[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Command incidents (CAD) table — read-only. */
export default function CommandIncidentTable({ incidents, isLoading, error, onRetry }: Props) {
  const columns: Column<CmdIncident>[] = [
    {
      key: "summary",
      header: "Incident",
      render: (i) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{i.summary ?? titleCase(i.category)}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">{humanize(i.source_type)}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (i) => <span className="text-gray-600 dark:text-gray-300">{titleCase(i.category)}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      render: (i) => <StatusBadge tone={severityTone(i.severity)}>{titleCase(i.severity)}</StatusBadge>,
    },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <StatusBadge tone={cmdIncidentStatusTone(i.status)}>{humanize(i.status)}</StatusBadge>
      ),
    },
    {
      key: "opened",
      header: "Opened",
      render: (i) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(i.opened_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (i) => <CommandIncidentActions incident={i} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={incidents}
      rowKey={(i) => i.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No command incidents"
      emptyDescription="No command incidents match the current filters."
    />
  );
}
