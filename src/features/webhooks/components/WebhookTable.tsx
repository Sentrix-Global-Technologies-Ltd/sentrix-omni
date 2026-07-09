import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import WebhookActions from "./WebhookActions";
import { formatDateTime } from "../../../lib/format";
import type { Webhook } from "../api/webhooks.types";

interface Props {
  webhooks: Webhook[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Registered webhooks table. */
export default function WebhookTable({ webhooks, isLoading, error, onRetry }: Props) {
  const columns: Column<Webhook>[] = [
    {
      key: "endpoint",
      header: "Endpoint",
      render: (w) => (
        <div className="min-w-0">
          <p className="break-all font-medium text-gray-800 dark:text-white/90">{w.url}</p>
          {w.description && <p className="mt-0.5 text-theme-xs text-gray-400">{w.description}</p>}
        </div>
      ),
    },
    {
      key: "events",
      header: "Events",
      render: (w) => (
        <span className="text-gray-600 dark:text-gray-300">
          {w.events.length > 2 ? `${w.events.slice(0, 2).join(", ")} +${w.events.length - 2}` : w.events.join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (w) => (
        <StatusBadge tone={w.active ? "success" : "light"}>{w.active ? "Active" : "Paused"}</StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (w) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(w.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (w) => <WebhookActions webhook={w} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={webhooks}
      rowKey={(w) => w.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No webhooks"
      emptyDescription="Register a webhook to receive Sentrix events at your endpoint."
    />
  );
}
