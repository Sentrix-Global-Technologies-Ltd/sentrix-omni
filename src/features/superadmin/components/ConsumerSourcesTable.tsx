import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { feedStatusLabel, feedStatusTone } from "../../camera-feeds/components/feedStatusTone";
import { formatDateTime, humanize } from "../../../lib/format";
import type { ConsumerCameraSource } from "../api/consumer-vision.types";

interface Props {
  sources: ConsumerCameraSource[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Cross-user consumer camera source registry (Sentrix Console). Read-only. */
export default function ConsumerSourcesTable({ sources, isLoading, error, onRetry }: Props) {
  const columns: Column<ConsumerCameraSource>[] = [
    {
      key: "id",
      header: "Ref",
      render: (s) => (
        <span className="text-theme-xs text-gray-400" title={s.id}>
          {s.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (s) => (
        <div>
          <p className="text-gray-800 dark:text-white/90">{s.user?.name ?? "—"}</p>
          <p className="text-theme-xs text-gray-400">{s.user?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "label",
      header: "Label",
      render: (s) => <span className="font-medium text-gray-800 dark:text-white/90">{s.label}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (s) => <span className="text-gray-500 dark:text-gray-400">{humanize(s.type)}</span>,
    },
    {
      key: "feed_status",
      header: "Feed",
      render: (s) => <StatusBadge tone={feedStatusTone(s.feed_status)}>{feedStatusLabel(s.feed_status)}</StatusBadge>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <span className="text-gray-500 dark:text-gray-400">{humanize(s.status)}</span>,
    },
    {
      key: "created_at",
      header: "Registered",
      render: (s) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(s.created_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sources}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No personal camera sources"
      emptyDescription="No consumer has registered a personal camera source yet."
    />
  );
}
