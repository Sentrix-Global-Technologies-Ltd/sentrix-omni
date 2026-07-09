import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useIncidentMutations } from "../hooks/useIncidentActions";
import type { IncidentSeverity } from "../api/incidents.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];

interface Props {
  /** When opened from an emergency, links the new incident back to it. */
  emergencyId?: string;
  /** Trigger button label (defaults to "New incident"). */
  triggerLabel?: string;
  triggerVariant?: "primary" | "outline";
}

/** Open a new incident. Navigates to the created incident on success. */
export default function CreateIncidentButton({ emergencyId, triggerLabel, triggerVariant = "primary" }: Props) {
  const { create } = useIncidentMutations();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [summary, setSummary] = useState("");

  const reset = () => {
    setTitle("");
    setSeverity("medium");
    setSummary("");
  };

  const submit = async () => {
    try {
      const res = await create.mutateAsync({
        title: title.trim(),
        severity,
        summary: summary.trim() || undefined,
        emergency_id: emergencyId,
      });
      setOpen(false);
      toast.success("Incident opened");
      if (res.data?.id) navigate(`/incidents/${res.data.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not open the incident.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={triggerVariant}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {triggerLabel ?? "New incident"}
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Open an incident</h3>
        {emergencyId && (
          <p className="mt-1 text-theme-xs text-gray-400">
            Linked to emergency {emergencyId.slice(0, 8)}.
          </p>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short description of the incident"
              className={fieldClass}
            />
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
            <label className="mb-1 block text-theme-xs text-gray-400">Summary (optional)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="What happened, where, and any context responders need."
              className={`${fieldClass} h-auto py-2.5`}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending || !title.trim()}>
            {create.isPending ? "Working…" : "Open incident"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
