import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { EyeIcon } from "../../../icons";
import { formatDateTime, humanize } from "../../../lib/format";
import { verificationStatusTone } from "./verificationStatusTone";
import { formatIdType } from "./verificationIdType";
import type { KycVerification } from "../api/verifications.types";

interface Props {
  verifications: KycVerification[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (verification: KycVerification) => void;
}

/** Cross-user KYC review queue (Sentrix Console). Read-only. */
export default function VerificationsQueueTable({ verifications, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<KycVerification>[] = [
    {
      key: "id",
      header: "Ref",
      render: (v) => (
        <span className="text-theme-xs text-gray-400" title={v.id}>
          {v.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (v) => (
        <div>
          <p className="text-gray-800 dark:text-white/90">{v.user?.name ?? "—"}</p>
          <p className="text-theme-xs text-gray-400">{v.user?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (v) => <span className="text-gray-500 dark:text-gray-400">{v.country}</span>,
    },
    {
      key: "id_type",
      header: "ID type",
      render: (v) => <span className="text-gray-500 dark:text-gray-400">{formatIdType(v.id_type)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <StatusBadge tone={verificationStatusTone(v.status)}>{humanize(v.status)}</StatusBadge>,
    },
    {
      key: "provider_status",
      header: "Provider result",
      render: (v) => <span className="text-gray-500 dark:text-gray-400">{v.provider_status ?? "—"}</span>,
    },
    {
      key: "submitted_at",
      header: "Submitted",
      render: (v) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(v.submitted_at)}</span>,
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (v) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(v.completed_at)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      // The whole row is already clickable (onRowClick below) — this is just
      // an explicit visual affordance so it's obvious there's a detail view.
      render: () => (
        <button
          type="button"
          aria-label="View submission"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
        >
          <EyeIcon className="size-5" />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={verifications}
      rowKey={(v) => v.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No KYC submissions"
      emptyDescription="No consumer has submitted an identity verification yet."
    />
  );
}
