import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, humanize, supportTicketStatusTone } from "./supportTicketTone";
import type { SupportTicket } from "../api/support.types";

interface Props {
  tickets: SupportTicket[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** "My tickets" — the caller's own support ticket history, self-only. */
export default function SupportTicketTable({ tickets, isLoading, error, onRetry }: Props) {
  const columns: Column<SupportTicket>[] = [
    {
      key: "id",
      header: "Ref",
      render: (t) => (
        <span className="text-theme-xs text-gray-400" title={t.id}>
          {t.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (t) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{t.title}</p>
          <p className="mt-0.5 max-w-md truncate text-theme-xs text-gray-400">{t.description}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Issue type",
      render: (t) => (
        <span className="text-gray-500 dark:text-gray-400">
          {t.category === "other" ? t.other_category ?? "Other" : t.category_label}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <StatusBadge tone={supportTicketStatusTone(t.status)}>{humanize(t.status)}</StatusBadge>
      ),
    },
    {
      key: "resolution",
      header: "Resolution",
      render: (t) => (
        <span className="text-gray-500 dark:text-gray-400">{t.resolution_notes ?? "—"}</span>
      ),
    },
    {
      key: "screenshot",
      header: "Screenshot",
      render: (t) =>
        t.screenshot_url ? (
          <a
            href={t.screenshot_url}
            target="_blank"
            rel="noreferrer"
            className="text-theme-sm font-medium text-brand-500 hover:underline"
          >
            View
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (t) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(t.created_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={tickets}
      rowKey={(t) => t.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No support tickets"
      emptyDescription="You haven't raised anything with Sentrix support yet."
    />
  );
}
