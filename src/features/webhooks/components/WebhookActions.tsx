import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import LoadingState from "../../../components/ui/state/LoadingState";
import EmptyState from "../../../components/ui/state/EmptyState";
import { formatDateTime } from "../../../lib/format";
import { useWebhookActions, useWebhookDeliveries } from "../hooks/useWebhooks";
import type { Webhook } from "../api/webhooks.types";

/** Per-row webhook actions: view deliveries + delete. */
export default function WebhookActions({ webhook }: { webhook: Webhook }) {
  const { remove } = useWebhookActions();
  const [open, setOpen] = useState(false);
  const deliveries = useWebhookDeliveries(webhook.id, open);
  const rows = deliveries.data?.data ?? [];

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Deliveries
      </Button>
      <ConfirmActionButton
        label="Delete"
        tone="danger"
        title="Delete webhook?"
        description={`Remove ${webhook.url}. It will stop receiving events.`}
        confirmLabel="Delete"
        successMessage="Webhook deleted"
        onConfirm={() => remove.mutateAsync(webhook.id)}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} className="mx-4 w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent deliveries</h3>
        <p className="mt-1 break-all text-theme-xs text-gray-400">{webhook.url}</p>

        <div className="mt-4 max-h-96 overflow-y-auto">
          {deliveries.isLoading ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <EmptyState title="No deliveries yet" description="This webhook hasn't fired yet." />
          ) : (
            <ul className="space-y-2">
              {rows.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90">{d.event}</span>
                      <StatusBadge tone={d.success ? "success" : "error"}>
                        {d.success ? "OK" : "Failed"}
                      </StatusBadge>
                    </div>
                    <p className="mt-0.5 text-theme-xs text-gray-400">
                      {formatDateTime(d.delivered_at ?? d.created_at)} · {d.attempts} attempt
                      {d.attempts === 1 ? "" : "s"}
                      {d.error ? ` · ${d.error}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                    {d.status_code ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}
