import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, titleCase } from "./commandTone";
import type { OrganizationOversight } from "../api/command.types";

interface Props {
  organizations: OrganizationOversight[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/**
 * Agency oversight table — read-only. Shows which organizations fall under a
 * command/agency's jurisdiction and a rolled-up activity count. No row action
 * exists here on purpose: an agency sees that something is happening in an
 * org, not the org's own operational records.
 */
export default function OrganizationOversightTable({
  organizations,
  isLoading,
  error,
  onRetry,
}: Props) {
  const columns: Column<OrganizationOversight>[] = [
    {
      key: "organization",
      header: "Organization",
      render: (o) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{o.name}</p>
          <p className="mt-0.5 text-theme-xs text-gray-400">{o.region ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "command",
      header: "Command area",
      render: (o) => (
        <div>
          <p className="text-gray-700 dark:text-gray-300">{o.command_name ?? "—"}</p>
          {o.command_tier && (
            <p className="mt-0.5 text-theme-xs text-gray-400">{titleCase(o.command_tier)}</p>
          )}
        </div>
      ),
    },
    {
      key: "agency",
      header: "Agency",
      render: (o) => <span className="text-gray-600 dark:text-gray-300">{o.agency_name ?? "—"}</span>,
    },
    {
      key: "activity",
      header: "Activity",
      render: (o) => (
        <div className="flex items-center gap-2">
          <StatusBadge tone={(o.open_incidents_count ?? 0) > 0 ? "warning" : "light"}>
            {o.open_incidents_count ?? 0} open incident{(o.open_incidents_count ?? 0) === 1 ? "" : "s"}
          </StatusBadge>
          <StatusBadge tone={(o.active_emergencies_count ?? 0) > 0 ? "error" : "light"}>
            {o.active_emergencies_count ?? 0} active emergenc{(o.active_emergencies_count ?? 0) === 1 ? "y" : "ies"}
          </StatusBadge>
        </div>
      ),
    },
    {
      key: "created",
      header: "Onboarded",
      render: (o) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(o.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={organizations}
      rowKey={(o) => o.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No organizations under this jurisdiction"
      emptyDescription="Organizations are linked automatically when their region matches a command area."
    />
  );
}
