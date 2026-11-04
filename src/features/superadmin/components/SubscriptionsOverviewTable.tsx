import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, humanize } from "../../../lib/format";
import { billingStatusTone } from "./billingStatusTone";
import type { PlatformBillingOrganization } from "../../billing/api/billing.types";

interface Props {
  rows: PlatformBillingOrganization[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: PlatformBillingOrganization) => void;
}

/** Customer organizations and their billing state (SuperAdmin billing console). */
export default function SubscriptionsOverviewTable({ rows, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<PlatformBillingOrganization>[] = [
    {
      key: "organization",
      header: "Organization",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
          <p className="text-theme-xs text-gray-400">{r.slug}</p>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (r) =>
        r.owner ? (
          <div>
            <p className="text-gray-700 dark:text-gray-300">{r.owner.name}</p>
            <p className="text-theme-xs text-gray-400">{r.owner.email}</p>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
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
      render: (r) => <StatusBadge tone={billingStatusTone(r.status)}>{humanize(r.status)}</StatusBadge>,
    },
    {
      key: "current_period_end",
      header: "Period ends",
      render: (r) => (
        <span className="text-gray-500 dark:text-gray-400">
          {r.status === "trialing" && r.trial_ends_at
            ? `Trial ${formatDateTime(r.trial_ends_at)}`
            : formatDateTime(r.current_period_end)}
        </span>
      ),
    },
    {
      key: "last_payment_at",
      header: "Last payment",
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(r.last_payment_at)}</span>,
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
      onRowClick={onRowClick}
      emptyTitle="No organizations found"
      emptyDescription="No customer organization matches these filters."
    />
  );
}
