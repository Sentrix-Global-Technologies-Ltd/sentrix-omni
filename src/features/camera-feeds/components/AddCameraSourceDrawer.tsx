import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { CloseIcon } from "../../../icons";
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
 * "Add Camera Source" — right-side slide-in drawer variant.
 * Same 2-step flow as AddCameraSourceModal (pick type → fill details) but
 * renders as a fixed panel sliding in from the right. Page content stays
 * full-width beneath it (no layout shift).
 *
 * Uses the same useCreateCameraSource hook and CAMERA_SOURCE_TYPES array as
 * the modal variant. The modal is retained for any future use cases.
 */
export default function AddCameraSourceDrawer({ open, onClose }: Props) {
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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!open) return null;

  const content = (
    <>
      {/* Backdrop — above top nav */}
      <div
        className="cs-drawer-backdrop"
        style={{ zIndex: 9998 }}
        onClick={close}
        aria-hidden="true"
      />
      {/* Panel — above backdrop */}
      <div
        className="cs-drawer"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-label="Add Camera Source"
      >
        <div className="cs-drawer-header">
          <span className="cs-drawer-title">Add Camera Source</span>
          <button className="cs-drawer-close" onClick={close} aria-label="Close">
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="cs-drawer-body">
          {!picked ? (
            /* ── Step 1: pick a type ── */
            <>
              <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
                Select the type of camera source you want to add.
              </p>
              <div className="space-y-2">
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
                      <span className="block font-medium text-gray-800 dark:text-white/90">
                        {t.label}
                      </span>
                      <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {t.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* ── Step 2: fill details ── */
            <>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {picked.icon}
                </span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{picked.label}</p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">{picked.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-theme-xs text-gray-400">Label *</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. North Entrance – Cam 01"
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
                    <label className="mb-1 block text-theme-xs text-gray-400">Connection URL *</label>
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
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="cs-drawer-footer">
          {picked ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setPicked(null)} disabled={create.isPending}>
                Back
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => void submit()}
                disabled={create.isPending || !label || (picked.requiresConnectionUrl && !connectionUrl)}
              >
                {create.isPending ? "Adding…" : "Add source"}
              </Button>
            </>
          ) : null}
        </div>

        {/* Guide link */}
        <div className="cs-drawer-guide">
          Need help? Check our{" "}
          <a
            href="https://www.youtube.com/@sentrix"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-drawer-guide-link"
          >
            integration guide
          </a>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
