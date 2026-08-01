import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { useFacilityActions } from "../hooks/useFacilityMap";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface Props {
  open: boolean;
  onClose: () => void;
  buildingId: string | null;
  buildingName: string;
}

/**
 * Add a zone inside a building. The zone's name must match a camera source's
 * `zone` field (with `site` matching the building's name) for that camera to
 * appear pinned inside it — see FacilityMapController::index().
 */
export default function AddZoneModal({ open, onClose, buildingId, buildingName }: Props) {
  const [name, setName] = useState("");
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(30);
  const { createZone } = useFacilityActions();
  const toast = useToast();

  const reset = () => {
    setName("");
    setX(10);
    setY(10);
    setWidth(30);
    setHeight(30);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!buildingId) return;
    try {
      await createZone.mutateAsync({ buildingId, payload: { name, x, y, width, height } });
      toast.success(`${name} added to ${buildingName}.`);
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add zone.");
    }
  };

  return (
    <Modal isOpen={open} onClose={close} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Zone — {buildingName}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Position and size are percentages within this building's box. Name the zone to match how it's
        registered on your cameras (Site/Zone) so feeds pin here automatically.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Entrance" className={fieldClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">X position</label>
            <input type="number" min={0} max={100} value={x} onChange={(e) => setX(Number(e.target.value))} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Y position</label>
            <input type="number" min={0} max={100} value={y} onChange={(e) => setY(Number(e.target.value))} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Width</label>
            <input type="number" min={1} max={100} value={width} onChange={(e) => setWidth(Number(e.target.value))} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-theme-xs text-gray-400">Height</label>
            <input type="number" min={1} max={100} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={fieldClass} />
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={close} disabled={createZone.isPending}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={() => void submit()} disabled={createZone.isPending || !name}>
          {createZone.isPending ? "Adding…" : "Add zone"}
        </Button>
      </div>
    </Modal>
  );
}
