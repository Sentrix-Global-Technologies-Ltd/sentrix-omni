import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import ClaimActions from "./ClaimActions";
import { claimStatusTone, formatDateTime, money, titleCase } from "./insuranceTone";
import type { Claim } from "../api/insurance.types";

interface Props {
  claims: Claim[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export default function ClaimTable({ claims, isLoading, error, onRetry }: Props) {
  const columns: Column<Claim>[] = [
    {
      key: "claim",
      header: "Claim",
      render: (c) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{money(c.amount_cents, c.currency)}</p>
          {c.description && <p className="mt-0.5 line-clamp-1 text-theme-xs text-gray-400">{c.description}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge tone={claimStatusTone(c.status)}>{titleCase(c.status)}</StatusBadge>,
    },
    {
      key: "filed",
      header: "Filed",
      render: (c) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(c.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (c) => <ClaimActions claim={c} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={claims}
      rowKey={(c) => c.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No claims"
      emptyDescription="No insurance claims have been filed."
    />
  );
}
