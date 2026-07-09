import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, money, policyStatusTone, titleCase } from "./insuranceTone";
import type { Policy } from "../api/insurance.types";

interface Props {
  policies: Policy[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export default function PolicyTable({ policies, isLoading, error, onRetry }: Props) {
  const columns: Column<Policy>[] = [
    {
      key: "title",
      header: "Policy",
      render: (p) => <span className="font-medium text-gray-800 dark:text-white/90">{p.title}</span>,
    },
    {
      key: "premium",
      header: "Premium",
      render: (p) => (
        <span className="tabular-nums text-gray-700 dark:text-gray-200">{money(p.premium_cents, p.currency)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge tone={policyStatusTone(p.status)}>{titleCase(p.status)}</StatusBadge>,
    },
    {
      key: "period",
      header: "Period",
      render: (p) => (
        <span className="text-gray-500 dark:text-gray-400">
          {p.period_start ? formatDateTime(p.period_start) : "—"} → {p.period_end ? formatDateTime(p.period_end) : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={policies}
      rowKey={(p) => p.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No policies"
      emptyDescription="No insurance policies for this organization yet."
    />
  );
}
