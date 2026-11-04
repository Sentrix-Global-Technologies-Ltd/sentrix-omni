import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, humanize } from "../../../lib/format";
import { billingStatusTone } from "./billingStatusTone";
import type { PlatformBillingIndividual } from "../../billing/api/billing.types";

interface Props {
  rows: PlatformBillingIndividual[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: PlatformBillingIndividual) => void;
}

/** Individual (consumer) subscribers and their billing state (SuperAdmin billing console). */
export default function IndividualSubscriptionsTable({ rows, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<PlatformBillingIndividual>[] = [
    {
      key: "user",
      header: "Individual",
      render: (r) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{r.name}</p>
          <p className="text-theme-xs text-gray-400">{r.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{r.phone ?? "—"}</span>,
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
      render: (r) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(r.current_period_end)}</span>,
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
      rowKey={(r) => r.user_id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onRowClick}
      emptyTitle="No individuals found"
      emptyDescription="No individual with a billing record matches these filters."
    />
  );
}
