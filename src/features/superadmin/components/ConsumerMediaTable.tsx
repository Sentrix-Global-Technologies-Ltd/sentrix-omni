import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { formatDateTime, humanize } from "../../../lib/format";
import type { ConsumerMediaAsset } from "../api/consumer-vision.types";

interface Props {
  media: ConsumerMediaAsset[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (asset: ConsumerMediaAsset) => void;
}

/** Cross-user consumer evidence uploads (Sentrix Console). Read-only. */
export default function ConsumerMediaTable({ media, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<ConsumerMediaAsset>[] = [
    {
      key: "id",
      header: "Ref",
      render: (m) => (
        <span className="text-theme-xs text-gray-400" title={m.id}>
          {m.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (m) => (
        <div>
          <p className="text-gray-800 dark:text-white/90">{m.user?.name ?? "—"}</p>
          <p className="text-theme-xs text-gray-400">{m.user?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "camera_source",
      header: "Source",
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{m.camera_source?.label ?? "—"}</span>,
    },
    {
      key: "content_type",
      header: "Type",
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{m.content_type ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{humanize(m.status)}</span>,
    },
    {
      key: "linked",
      header: "Linked to",
      render: (m) => (
        <span className="text-gray-500 dark:text-gray-400">
          {m.emergency_id ? "Emergency" : m.trip_id ? "Trip" : "—"}
        </span>
      ),
    },
    {
      key: "captured_at",
      header: "Captured",
      render: (m) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(m.captured_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={media}
      rowKey={(m) => m.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No evidence uploaded"
      emptyDescription="No consumer has uploaded personal camera evidence yet."
    />
  );
}
