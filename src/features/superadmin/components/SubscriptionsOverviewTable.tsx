import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime } from "../../../lib/format";
import type { OrganizationSubscriptionOverview } from "../../billing/api/billing.types";

function statusTone(s: string): "success" | "warning" | "error" | "light" {
  if (s === "active") return "success";
  if (s === "trialing") return "warning";
  if (s === "cancelled" || s === "canceled") return "error";
  return "light";
}

interface Props {
  rows: OrganizationSubscriptionOverview[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Cross-tenant subscription oversight (Sentrix Console, SuperAdmin only). */
export default function SubscriptionsOverviewTable({ rows, isLoading, error, onRetry }: Props) {
  const columns: Column<OrganizationSubscriptionOverview>[] = [
    {
      key: "organization",
      header: "Organization",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.organization_name ?? "—"}</p>
          {r.organization_slug && <p className="text-theme-xs text-gray-400">{r.organization_slug}</p>}
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (r) => <span className="text-gray-700 dark:text-gray-300">{r.plan_name}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      key: "trial_ends_at",
      header: "Trial ends",
      render: (r) => (
        <span className="text-gray-500 dark:text-gray-400">
          {r.status === "trialing" && r.trial_ends_at ? formatDateTime(r.trial_ends_at) : "—"}
        </span>
      ),
    },
    {
      key: "current_period_end",
      header: "Renews",
      render: (r) => (
        <span className="text-gray-500 dark:text-gray-400">
          {r.current_period_end ? formatDateTime(r.current_period_end) : "—"}
        </span>
      ),
    },
    {
      key: "auto_renew",
      header: "Auto-renew",
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{r.auto_renew ? "On" : "Off"}</span>,
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(r.updated_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.organization_id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No subscriptions"
      emptyDescription="No organization has a subscription record yet."
    />
  );
}
