import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { useSurgeAction } from "../hooks/useRidesOpsActions";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Pin or release surge pricing (SuperAdmin). */
export default function SurgeButton() {
  const surge = useSurgeAction();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [multiplier, setMultiplier] = useState("1.5");
  const [zone, setZone] = useState("");
  const [note, setNote] = useState("");

  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Surge update failed.");

  const pin = async () => {
    try {
      await surge.mutateAsync({ multiplier: Number(multiplier), zone: zone || undefined, note: note || undefined });
      toast.success("Surge pinned");
      setOpen(false);
    } catch (e) {
      fail(e);
    }
  };

  const release = async () => {
    try {
      await surge.mutateAsync({ release: true });
      toast.success("Surge released");
      setOpen(false);
    } catch (e) {
      fail(e);
    }
  };

  return (
    <Can superAdminOnly>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Surge pricing
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} showCloseButton={false} className="mx-4 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Surge pricing</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Multiplier (1.0–3.0)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="3"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Zone (optional)</label>
            <input value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button size="sm" variant="outline" onClick={release} disabled={surge.isPending}>
            Release surge
          </Button>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={surge.isPending}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={pin} disabled={surge.isPending}>
              {surge.isPending ? "Working…" : "Pin surge"}
            </Button>
          </div>
        </div>
      </Modal>
    </Can>
  );
}
