import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { communityStatusTone, formatDateTime } from "./communityTone";
import type { PlatformCommunityAlert } from "../api/community.types";

interface Props {
  alerts: PlatformCommunityAlert[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (alert: PlatformCommunityAlert) => void;
}

/** Sentrix Console — crowdsourced community alerts, cross-reporter visibility. */
export default function CommunityAlertsTable({ alerts, isLoading, error, onRetry, onRowClick }: Props) {
  const columns: Column<PlatformCommunityAlert>[] = [
    {
      key: "title",
      header: "Report",
      render: (a) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{a.title}</p>
          <p className="text-theme-xs text-gray-400">{a.category}</p>
        </div>
      ),
    },
    {
      key: "reporter",
      header: "Reporter",
      render: (a) => (
        <div>
          <p className="text-gray-700 dark:text-gray-300">{a.reporter_name ?? "Unknown"}</p>
          {a.is_anonymous && <StatusBadge tone="warning">Anonymous to users</StatusBadge>}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (a) => <span className="capitalize text-gray-500 dark:text-gray-400">{a.source}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <StatusBadge tone={communityStatusTone(a.status)}>{a.status}</StatusBadge>,
    },
    {
      key: "engagement",
      header: "Engagement",
      render: (a) => (
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {a.likes_count} likes · {a.helpful_count} helpful · {a.comments_count} comments
        </span>
      ),
    },
    {
      key: "evidence",
      header: "Evidence",
      render: (a) => (
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {[a.photo_url ? "Photo" : null, a.video_url ? "Video" : null].filter(Boolean).join(" + ") || "None"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Reported",
      render: (a) => <span className="text-gray-500 dark:text-gray-400">{formatDateTime(a.created_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={alerts}
      rowKey={(a) => a.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No community reports"
      emptyDescription="Nothing matches these filters."
    />
  );
}
