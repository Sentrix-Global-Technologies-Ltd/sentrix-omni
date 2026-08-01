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
}

/**
 * Draw a new building on the Facility Map canvas. Position/size are entered
 * as percentages (0-100) of the canvas — there's no drag-to-draw interaction
 * in this pass, just direct numeric placement (still a real, persisted
 * layout — just a simpler input method than a full drag/resize editor).
 */
export default function AddBuildingModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [width, setWidth] = useState(25);
  const [height, setHeight] = useState(25);
  const { createBuilding } = useFacilityActions();
  const toast = useToast();

  const reset = () => {
    setName("");
    setX(10);
    setY(10);
    setWidth(25);
    setHeight(25);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    try {
      await createBuilding.mutateAsync({ name, x, y, width, height });
      toast.success(`${name} added to the map.`);
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add building.");
    }
  };

  return (
    <Modal isOpen={open} onClose={close} className="mx-4 w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Building</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Position and size are percentages of the map canvas (0-100).
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-theme-xs text-gray-400">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Building A" className={fieldClass} />
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
        <Button size="sm" variant="outline" onClick={close} disabled={createBuilding.isPending}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={() => void submit()} disabled={createBuilding.isPending || !name}>
          {createBuilding.isPending ? "Adding…" : "Add building"}
        </Button>
      </div>
    </Modal>
  );
}
