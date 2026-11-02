import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { useCreateCameraSource } from "../hooks/useCameraSourceActions";
import { CAMERA_SOURCE_TYPES, type CameraSourceTypeMeta } from "./cameraSourceTypeMeta";
import { userMessage } from "../../../services/api/errors";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * "Add Camera Source" — a two-step flow: pick one of the 8 source types
 * (SourceType::orgPickerValues() on the backend), then fill in the details
 * that type actually needs (a connection URL for IP Camera/RTSP/External
 * CCTV, nothing extra for the rest). Registers a real CameraSource row via
 * OrganizationCameraSourceController; it does not fabricate a live feed for
 * types that need one — the row exists, but frames only ever arrive through
 * whichever real ingest path that source type actually supports.
 */
export default function AddCameraSourceModal({ open, onClose }: Props) {
  const [picked, setPicked] = useState<CameraSourceTypeMeta | null>(null);
  const [label, setLabel] = useState("");
  const [site, setSite] = useState("");
  const [zone, setZone] = useState("");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const create = useCreateCameraSource();
  const toast = useToast();

  const reset = () => {
    setPicked(null);
    setLabel("");
    setSite("");
    setZone("");
    setConnectionUrl("");
    setTagsInput("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!picked) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await create.mutateAsync({
        type: picked.value,
        label,
        site: site || undefined,
        zone: zone || undefined,
        connection_url: connectionUrl || undefined,
        tags: tags.length ? tags : undefined,
      });
      toast.success(`${picked.label} added.`);
      close();
    } catch (e) {
      toast.error(userMessage(e, "Could not add camera source."));
    }
  };

  return (
    <Modal isOpen={open} onClose={close} className="mx-4 w-full max-w-lg p-6">
      {!picked ? (
        <>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Camera Source</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select the type of camera source you want to add.
          </p>
          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {CAMERA_SOURCE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPicked(t)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {t.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-gray-800 dark:text-white/90">{t.label}</span>
                  <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{t.description}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" onClick={close}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              {picked.icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{picked.label}</h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{picked.description}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. North Entrance - Cam 01"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Site / Building</label>
                <input value={site} onChange={(e) => setSite(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Zone</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass} />
              </div>
            </div>
            {picked.requiresConnectionUrl && (
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Connection URL</label>
                <input
                  value={connectionUrl}
                  onChange={(e) => setConnectionUrl(e.target.value)}
                  placeholder="rtsp://192.168.1.101:554/stream1"
                  className={fieldClass}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Tags (comma separated)</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Entrance, Outdoor"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button size="sm" variant="outline" onClick={() => setPicked(null)} disabled={create.isPending}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={close} disabled={create.isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => void submit()}
                disabled={create.isPending || !label || (picked.requiresConnectionUrl && !connectionUrl)}
              >
                {create.isPending ? "Adding…" : "Add source"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
