import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { CloseIcon } from "../../../icons";
import { ValidationError, userMessage } from "../../../services/api/errors";
import { useUpdateCameraSource } from "../hooks/useCameraSourceActions";
import { CAMERA_SOURCE_TYPES } from "./cameraSourceTypeMeta";
import type { CameraSource } from "../api/camera-feeds.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const fieldClassError =
  "h-11 w-full rounded-lg border border-red-400 bg-transparent px-4 text-sm text-gray-800 focus:border-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-500/10 dark:border-red-500 dark:bg-gray-900 dark:text-white/90";
const errorMsgClass = "mt-1 text-xs text-red-600 dark:text-red-400";

interface Props {
  /** Source to edit; null means closed. */
  source: CameraSource | null;
  onClose: () => void;
}

/**
 * "Edit Camera Source" — right-side slide-in drawer variant.
 * Pre-populates all editable fields from the selected source and PATCHes
 * only the changed values via the existing useUpdateCameraSource hook.
 *
 * Mirrors the layout and behaviour of AddCameraSourceDrawer. Uses the same
 * cs-drawer-* classes from camera-sources.css (already imported by
 * CameraSourcesPage, so no duplicate import is needed here).
 *
 * Fields editable: label, site, zone, connection_url, tags, status.
 * Field NOT editable: type (backend PATCH contract does not accept it).
 *
 * Permission gate: bridges.manage — same as create (UpdateOrganizationCameraSourceRequest).
 */
export default function EditCameraSourceDrawer({ source, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [site, setSite] = useState("");
  const [zone, setZone] = useState("");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  /** Field-level backend validation errors keyed by field name. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = useUpdateCameraSource(source?.id ?? "");
  const toast = useToast();

  /** True when this type requires a connection URL (mirrors SourceType::requiresConnectionUrl). */
  const requiresConnectionUrl =
    CAMERA_SOURCE_TYPES.find((t) => t.value === source?.type)?.requiresConnectionUrl ?? false;

  /** Populate form whenever the selected source changes. */
  useEffect(() => {
    if (!source) return;
    setLabel(source.label);
    setSite(source.site ?? "");
    setZone(source.zone ?? "");
    setConnectionUrl(source.connection_url ?? "");
    setTagsInput((source.tags ?? []).join(", "));
    setStatus((source.status as "active" | "inactive") ?? "active");
    setFieldErrors({});
  }, [source]);

  const open = source !== null;

  const close = () => {
    setFieldErrors({});
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
    if (!source) return;
    setFieldErrors({});
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await update.mutateAsync({
        label,
        site: site || null,
        zone: zone || null,
        connection_url: connectionUrl || null,
        tags: tags.length ? tags : [],
        status,
      });
      toast.success(`${label} updated.`);
      close();
    } catch (e) {
      if (e instanceof ValidationError && Object.keys(e.errors).length > 0) {
        // Surface per-field errors next to the appropriate inputs
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(e.errors)) {
          mapped[field] = messages[0] ?? "";
        }
        setFieldErrors(mapped);
      } else {
        toast.error(userMessage(e, "Could not update camera source."));
      }
    }
  };

  if (!open) return null;

  /** Display the source type label (read-only; cannot be changed via PATCH). */
  const typeMeta = CAMERA_SOURCE_TYPES.find((t) => t.value === source?.type);

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="cs-drawer-backdrop"
        style={{ zIndex: 9998 }}
        onClick={close}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="cs-drawer"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-label="Edit Camera Source"
      >
        <div className="cs-drawer-header">
          <span className="cs-drawer-title">Edit Camera Source</span>
          <button className="cs-drawer-close" onClick={close} aria-label="Close">
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="cs-drawer-body">
          {/* Read-only type badge at top */}
          {typeMeta && (
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                {typeMeta.icon}
              </span>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">{typeMeta.label}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Source type — cannot be changed after creation
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Label */}
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Label *</label>
              <input
                value={label}
                onChange={(e) => { setLabel(e.target.value); setFieldErrors((p) => ({ ...p, label: "" })); }}
                placeholder="e.g. North Entrance – Cam 01"
                className={fieldErrors.label ? fieldClassError : fieldClass}
                aria-describedby={fieldErrors.label ? "err-label" : undefined}
              />
              {fieldErrors.label && (
                <p id="err-label" role="alert" className={errorMsgClass}>{fieldErrors.label}</p>
              )}
            </div>

            {/* Site / Zone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Site / Building</label>
                <input
                  value={site}
                  onChange={(e) => { setSite(e.target.value); setFieldErrors((p) => ({ ...p, site: "" })); }}
                  className={fieldErrors.site ? fieldClassError : fieldClass}
                  aria-describedby={fieldErrors.site ? "err-site" : undefined}
                />
                {fieldErrors.site && (
                  <p id="err-site" role="alert" className={errorMsgClass}>{fieldErrors.site}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">Zone</label>
                <input
                  value={zone}
                  onChange={(e) => { setZone(e.target.value); setFieldErrors((p) => ({ ...p, zone: "" })); }}
                  className={fieldErrors.zone ? fieldClassError : fieldClass}
                  aria-describedby={fieldErrors.zone ? "err-zone" : undefined}
                />
                {fieldErrors.zone && (
                  <p id="err-zone" role="alert" className={errorMsgClass}>{fieldErrors.zone}</p>
                )}
              </div>
            </div>

            {/* Connection URL — shown when the source type requires it, or
                when the source already has one (user may want to clear it). */}
            {(requiresConnectionUrl || connectionUrl) && (
              <div>
                <label className="mb-1 block text-theme-xs text-gray-400">
                  Connection URL{requiresConnectionUrl ? " *" : ""}
                </label>
                <input
                  value={connectionUrl}
                  onChange={(e) => { setConnectionUrl(e.target.value); setFieldErrors((p) => ({ ...p, connection_url: "" })); }}
                  placeholder="rtsp://192.168.1.101:554/stream1"
                  className={fieldErrors.connection_url ? fieldClassError : fieldClass}
                  aria-describedby={fieldErrors.connection_url ? "err-connection-url" : undefined}
                />
                {fieldErrors.connection_url && (
                  <p id="err-connection-url" role="alert" className={errorMsgClass}>{fieldErrors.connection_url}</p>
                )}
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Tags (comma separated)</label>
              <input
                value={tagsInput}
                onChange={(e) => { setTagsInput(e.target.value); setFieldErrors((p) => ({ ...p, tags: "" })); }}
                placeholder="Entrance, Outdoor"
                className={fieldErrors.tags ? fieldClassError : fieldClass}
                aria-describedby={fieldErrors.tags ? "err-tags" : undefined}
              />
              {fieldErrors.tags && (
                <p id="err-tags" role="alert" className={errorMsgClass}>{fieldErrors.tags}</p>
              )}
            </div>

            {/* Status toggle */}
            <div>
              <label className="mb-1 block text-theme-xs text-gray-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className={fieldClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cs-drawer-footer">
          <Button size="sm" variant="outline" onClick={close} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void submit()}
            disabled={update.isPending || !label.trim()}
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
