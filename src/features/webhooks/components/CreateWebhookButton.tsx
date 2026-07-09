import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import SecretRevealDialog from "../../../components/shared/SecretRevealDialog";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useWebhookActions } from "../hooks/useWebhooks";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Register a webhook; reveals the signing secret once on success. */
export default function CreateWebhookButton() {
  const { create } = useWebhookActions();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("");
  const [description, setDescription] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const submit = async () => {
    const list = events
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    try {
      const res = await create.mutateAsync({ url, events: list, description: description || undefined });
      setOpen(false);
      setSecret(res.data.secret ?? "(no secret returned)");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create webhook.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          setUrl("");
          setEvents("");
          setDescription("");
          setOpen(true);
        }}
      >
        Add webhook
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Register a webhook</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Endpoint URL (https)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Events (comma-separated)</label>
            <input
              value={events}
              onChange={(e) => setEvents(e.target.value)}
              placeholder="incident.opened, emergency.triggered"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending || !url || !events.trim()}>
            {create.isPending ? "Working…" : "Create"}
          </Button>
        </div>
      </Modal>

      <SecretRevealDialog
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Webhook signing secret"
        secret={secret ?? ""}
        description="Use this to verify webhook signatures."
      />
    </>
  );
}
