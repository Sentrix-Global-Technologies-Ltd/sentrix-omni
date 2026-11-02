import "../styles/hardware-console.css";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../../components/ui/button/Button";
import { useToast } from "../../../components/shared/toast";
import { CloseIcon } from "../../../icons";
import { ValidationError, userMessage } from "../../../services/api/errors";
import { useRegisterDevice } from "../hooks/useHardware";
import { DEVICE_KINDS } from "../api/hardware.types";
import type { DeviceKindValue } from "../api/hardware.types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const fieldClassError =
  "h-11 w-full rounded-lg border border-red-400 bg-transparent px-4 text-sm text-gray-800 focus:border-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-500/10 dark:border-red-500 dark:bg-gray-900 dark:text-white/90";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const selectClassError =
  "h-11 w-full rounded-lg border border-red-400 bg-white px-4 text-sm text-gray-800 focus:border-red-400 focus:outline-hidden focus:ring-3 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * "Register Device" — right-side slide-in drawer.
 *
 * Fields mirror RegisterDeviceRequest exactly:
 *   kind (required, enum), serial (required), name (required),
 *   site (optional), zone (optional).
 * metadata is omitted from the UI — it is an advanced field reserved
 * for programmatic device provisioning.
 *
 * Uses the cs-drawer-* CSS classes established by AddCameraSourceDrawer.
 * Shows per-field validation errors from the backend (422 ValidationError).
 */
export default function RegisterDeviceDrawer({ open, onClose }: Props) {
  const [kind, setKind] = useState<DeviceKindValue>("other");
  const [serial, setSerial] = useState("");
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [zone, setZone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const register = useRegisterDevice();
  const toast = useToast();
  const formId = useId();

  const reset = () => {
    setKind("other");
    setSerial("");
    setName("");
    setSite("");
    setZone("");
    setFieldErrors({});
    register.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = serial.trim().length > 0 && name.trim().length > 0 && !register.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    setFieldErrors({});
    try {
      await register.mutateAsync({
        kind,
        serial: serial.trim(),
        name: name.trim(),
        site: site.trim() || null,
        zone: zone.trim() || null,
      });
      toast.success(`Device "${name.trim()}" registered.`);
      close();
    } catch (e) {
      if (e instanceof ValidationError && Object.keys(e.errors).length > 0) {
        // Map backend field errors to per-field display; toast the summary.
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(e.errors)) {
          if (Array.isArray(msgs) && msgs.length > 0) flat[field] = msgs[0];
        }
        setFieldErrors(flat);
        toast.error(e.message);
      } else {
        toast.error(userMessage(e, "Could not register device."));
      }
    }
  };

  /** First error for a field, or undefined. */
  const fe = (field: string) => fieldErrors[field];

  if (!open) return null;

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
        aria-label="Register Device"
        aria-labelledby={`${formId}-title`}
      >
        <div className="cs-drawer-header">
          <span id={`${formId}-title`} className="cs-drawer-title">Register Device</span>
          <button className="cs-drawer-close" onClick={close} aria-label="Close">
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="cs-drawer-body">
          <p className="mb-5 text-theme-xs text-gray-500 dark:text-gray-400">
            Register a physical security device in this organization's hardware registry. The device
            will be set to <strong>Active</strong> immediately.
          </p>

          <div className="space-y-4">
            {/* Kind */}
            <div>
              <label htmlFor={`${formId}-kind`} className="mb-1 block text-theme-xs text-gray-400">
                Device type <span aria-hidden="true">*</span>
              </label>
              <select
                id={`${formId}-kind`}
                value={kind}
                onChange={(e) => setKind(e.target.value as DeviceKindValue)}
                className={fe("kind") ? selectClassError : selectClass}
                disabled={register.isPending}
              >
                {DEVICE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
              {fe("kind") && (
                <p className="mt-1 text-theme-xs text-red-500" role="alert">{fe("kind")}</p>
              )}
            </div>

            {/* Serial */}
            <div>
              <label htmlFor={`${formId}-serial`} className="mb-1 block text-theme-xs text-gray-400">
                Serial number <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${formId}-serial`}
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="e.g. SN-00X-20941"
                className={fe("serial") ? fieldClassError : fieldClass}
                disabled={register.isPending}
                autoComplete="off"
              />
              {fe("serial") && (
                <p className="mt-1 text-theme-xs text-red-500" role="alert">{fe("serial")}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor={`${formId}-name`} className="mb-1 block text-theme-xs text-gray-400">
                Display name <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Gate – Scanner 01"
                className={fe("name") ? fieldClassError : fieldClass}
                disabled={register.isPending}
              />
              {fe("name") && (
                <p className="mt-1 text-theme-xs text-red-500" role="alert">{fe("name")}</p>
              )}
            </div>

            {/* Site / Zone — optional */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formId}-site`} className="mb-1 block text-theme-xs text-gray-400">
                  Site / Building
                </label>
                <input
                  id={`${formId}-site`}
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="e.g. Building A"
                  className={fieldClass}
                  disabled={register.isPending}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-zone`} className="mb-1 block text-theme-xs text-gray-400">
                  Zone
                </label>
                <input
                  id={`${formId}-zone`}
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Reception"
                  className={fieldClass}
                  disabled={register.isPending}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cs-drawer-footer">
          <Button size="sm" variant="outline" onClick={close} disabled={register.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void submit()}
            disabled={!canSubmit}
          >
            {register.isPending ? "Registering…" : "Register device"}
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
