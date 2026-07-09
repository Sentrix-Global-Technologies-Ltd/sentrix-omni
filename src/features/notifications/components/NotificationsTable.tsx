import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Button from "../../../components/ui/button/Button";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import { formatDateTime, humanize } from "../../../lib/format";
import type { AppNotification } from "../api/notifications.types";

function title(n: AppNotification): string {
  const t = n.payload?.title;
  return typeof t === "string" && t ? t : humanize(n.type);
}

function message(n: AppNotification): string {
  const m = n.payload?.message ?? n.payload?.body;
  return typeof m === "string" ? m : "";
}

interface Props {
  notifications: AppNotification[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onMarkRead: (id: string) => void;
  /** Delete a notification; returns the mutation promise so the dialog can await it. */
  onDelete: (id: string) => Promise<unknown>;
  busy?: boolean;
}

/** Notification feed as a shared DataTable (no detail page; per-row mark-read). */
export default function NotificationsTable({
  notifications,
  isLoading,
  error,
  onRetry,
  onMarkRead,
  onDelete,
  busy,
}: Props) {
  const columns: Column<AppNotification>[] = [
    {
      key: "notification",
      header: "Notification",
      render: (n) => (
        <div className={n.read ? "opacity-60" : ""}>
          <p className="font-medium text-gray-800 dark:text-white/90">{title(n)}</p>
          {message(n) && (
            <p className="mt-0.5 line-clamp-1 text-theme-xs text-gray-400">{message(n)}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (n) => (
        <StatusBadge tone={n.read ? "light" : "info"}>
          {n.read ? "Read" : "Unread"}
        </StatusBadge>
      ),
    },
    {
      key: "received",
      header: "Received",
      render: (n) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(n.created_at)}</span>
      ),
    },
    {
      key: "action",
      header: "",
      render: (n) => (
        <div className="flex items-center justify-end gap-2">
          {!n.read && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onMarkRead(n.id)}>
              Mark read
            </Button>
          )}
          <ConfirmActionButton
            label="Delete"
            tone="danger"
            title="Delete notification?"
            description="This permanently removes the notification. This can't be undone."
            confirmLabel="Delete"
            successMessage="Notification deleted"
            onConfirm={() => onDelete(n.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={notifications}
      rowKey={(n) => n.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No notifications"
      emptyDescription="You're all caught up."
    />
  );
}
