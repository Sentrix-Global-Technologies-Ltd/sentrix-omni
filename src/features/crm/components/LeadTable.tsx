import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, leadStageTone, titleCase } from "./leadTone";
import type { Lead } from "../api/leads.types";

interface Props {
  leads: Lead[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (lead: Lead) => void;
}

/** Lead pipeline table — supplies columns to the shared DataTable. */
export default function LeadTable({
  leads,
  isLoading,
  error,
  onRetry,
  onRowClick,
}: Props) {
  const columns: Column<Lead>[] = [
    {
      key: "lead",
      header: "Lead",
      render: (l) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{l.name}</p>
          {l.contact_name && (
            <p className="mt-0.5 text-theme-xs text-gray-400">{l.contact_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "client_type",
      header: "Type",
      render: (l) => (
        <span className="text-gray-600 dark:text-gray-300">{titleCase(l.client_type)}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (l) => (
        <StatusBadge tone={leadStageTone[l.stage]}>{titleCase(l.stage)}</StatusBadge>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (l) => (
        <span className="text-gray-600 dark:text-gray-300">{l.region ?? "—"}</span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (l) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(l.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={leads}
      rowKey={(l) => l.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No leads"
      emptyDescription="No leads match the current filters."
    />
  );
}
