import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useIncidentActions } from "../hooks/useIncidentActions";
import type { Incident, IncidentSeverity } from "../api/incidents.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];

/** Edit an incident's title, severity, and summary. Gate with <Can incidents.update>. */
export default function EditIncidentButton({ incident, triggerClassName }: { incident: Incident; triggerClassName?: string }) {
  const { update } = useIncidentActions(incident.id);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(incident.title);
  const [severity, setSeverity] = useState<IncidentSeverity>(incident.severity);
  const [summary, setSummary] = useState(incident.summary ?? "");

  const openModal = () => {
    setTitle(incident.title);
    setSeverity(incident.severity);
    setSummary(incident.summary ?? "");
    setOpen(true);
  };

  const submit = async () => {
    try {
      await update.mutateAsync({
        title: title.trim(),
        severity,
        summary: summary.trim() || undefined,
      });
      setOpen(false);
      toast.success("Incident updated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update the incident.");
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={openModal} className={triggerClassName}>
        Edit
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit incident</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)} className={fieldClass}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className={`${fieldClass} h-auto py-2.5`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={update.isPending || !title.trim()}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
