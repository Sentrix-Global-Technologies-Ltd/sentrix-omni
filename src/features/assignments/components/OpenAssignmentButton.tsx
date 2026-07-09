import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useAssignmentMutations } from "../hooks/useAssignments";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Open a dispatch coordination record for an incident — the missing first
 * step of the dispatch loop. Navigates to the new assignment on success,
 * where responders are offered (AddResponderAction).
 */
export default function OpenAssignmentButton({ incidentId }: { incidentId: string }) {
  const { create } = useAssignmentMutations();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<"manual" | "auto">("manual");
  const [requiredSupporting, setRequiredSupporting] = useState(0);

  const reset = () => {
    setDispatchMode("manual");
    setRequiredSupporting(0);
  };

  const submit = async () => {
    try {
      const res = await create.mutateAsync({
        incident_id: incidentId,
        dispatch_mode: dispatchMode,
        required_supporting: requiredSupporting,
      });
      setOpen(false);
      toast.success("Dispatch opened");
      if (res.data?.id) navigate(`/assignments/${res.data.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not open a dispatch for this incident.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Open assignment
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Open a dispatch</h3>
        <p className="mt-1 text-theme-xs text-gray-400">
          Starts coordinating a response to this incident. You'll offer responders next.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Dispatch mode</label>
            <select
              value={dispatchMode}
              onChange={(e) => setDispatchMode(e.target.value as "manual" | "auto")}
              className={fieldClass}
            >
              <option value="manual" className="dark:bg-gray-900">Manual — I'll pick responders</option>
              <option value="auto" className="dark:bg-gray-900">Auto — let the system assign</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Supporting responders needed (optional)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={requiredSupporting}
              onChange={(e) => setRequiredSupporting(Math.max(0, Number(e.target.value) || 0))}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Working…" : "Open dispatch"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
