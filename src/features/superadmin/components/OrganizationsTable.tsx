import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import type { PlatformOrganization } from "../api/organizations.types";

function subscriptionTone(status: string | null): "success" | "warning" | "error" | "light" {
  if (status === "active") return "success";
  if (status === "trialing") return "warning";
  if (status === "cancelled" || status === "canceled") return "error";
  return "light";
}

interface Props {
  organizations: PlatformOrganization[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (organization: PlatformOrganization) => void;
}

/** Cross-tenant organization directory (Sentrix Console, organizations.view). */
export default function OrganizationsTable({ organizations, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<PlatformOrganization>[] = [
    {
      key: "name",
      header: "Organization",
      render: (o) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{o.name}</p>
          <p className="text-theme-xs text-gray-400">{o.slug}</p>
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (o) => <span className="text-gray-500 dark:text-gray-400">{o.region ?? "—"}</span>,
    },
    {
      key: "members_count",
      header: "Users",
      render: (o) => <span className="tabular-nums text-gray-700 dark:text-gray-200">{o.members_count ?? "—"}</span>,
    },
    {
      key: "hardware",
      header: "Hardware / CCTV",
      render: (o) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">
          {o.devices_count ?? 0} / {o.camera_sources_count ?? 0}
        </span>
      ),
    },
    {
      key: "cameras_online",
      header: "Cameras Online",
      render: (o) => {
        const total = o.camera_sources_count ?? 0;
        const online = o.camera_sources_online_count ?? 0;
        if (total === 0) return <span className="text-theme-xs text-gray-400">—</span>;
        return (
          <StatusBadge tone={online === total ? "success" : online === 0 ? "error" : "warning"}>
            {online} / {total}
          </StatusBadge>
        );
      },
    },
    {
      key: "incidents",
      header: "Open Incidents",
      render: (o) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">{o.open_incidents_count ?? 0}</span>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      render: (o) => (
        <StatusBadge tone={subscriptionTone(o.subscription_status)}>
          {o.subscription_plan_key ?? "no record"}
        </StatusBadge>
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
      onRowClick={onRowClick}
      emptyTitle="No organizations"
      emptyDescription="No organization has been provisioned on the platform yet."
    />
  );
}
