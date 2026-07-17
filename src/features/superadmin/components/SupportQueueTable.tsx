import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, humanize, supportTicketStatusTone } from "../../support/components/supportTicketTone";
import type { SupportTicket } from "../../support/api/support.types";

interface Props {
  tickets: SupportTicket[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (ticket: SupportTicket) => void;
}

/** Cross-tenant support ticket queue (Sentrix Console). */
export default function SupportQueueTable({ tickets, isLoading, error, onRetry, onRowClick }: Props) {
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
      key: "organization",
      header: "Organization",
      render: (t) => (
        <span className="text-gray-700 dark:text-gray-300">{t.organization?.name ?? "—"}</span>
      ),
    },
    {
      key: "submitter",
      header: "Submitted by",
      render: (t) => (
        <div>
          <p className="text-gray-800 dark:text-white/90">{t.submitter?.name ?? "—"}</p>
          <p className="text-theme-xs text-gray-400">{t.submitter?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (t) => <p className="font-medium text-gray-800 dark:text-white/90">{t.title}</p>,
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
      key: "assignee",
      header: "Assigned to",
      render: (t) => (
        <span className="text-gray-500 dark:text-gray-400">{t.assignee?.name ?? "Unassigned"}</span>
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
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No support tickets"
      emptyDescription="No organization has raised a support ticket yet."
    />
  );
}
