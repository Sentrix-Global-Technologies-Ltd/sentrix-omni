import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import MutualAidActions from "./MutualAidActions";
import { formatDateTime, mutualAidStatusTone, titleCase } from "./coordinationTone";
import type { MutualAidRequest } from "../api/coordination.types";

interface Props {
  requests: MutualAidRequest[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Mutual-aid requests between commands/agencies. */
export default function MutualAidTable({ requests, isLoading, error, onRetry }: Props) {
  const columns: Column<MutualAidRequest>[] = [
    {
      key: "request",
      header: "Request",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {r.requesting_command_id.slice(0, 8)} → {r.responding_command_id.slice(0, 8)}
          </p>
          {r.message && <p className="mt-0.5 text-theme-xs text-gray-400">{r.message}</p>}
        </div>
      ),
    },
    {
      key: "incident",
      header: "Incident",
      render: (r) => (
        <span className="text-gray-600 dark:text-gray-300">{r.command_incident_id.slice(0, 8)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge tone={mutualAidStatusTone(r.status)}>{titleCase(r.status)}</StatusBadge>,
    },
    {
      key: "created",
      header: "Requested",
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(r.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => <MutualAidActions request={r} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No mutual-aid requests"
      emptyDescription="No mutual-aid requests match the current filters."
    />
  );
}
