import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthz } from "../../../hooks/useAuthz";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import { useDeviceActions, useTransitionDeviceStatus } from "../hooks/useHardware";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import type { Device, DeviceStatusValue } from "../api/hardware.types";
import { ALLOWED_TRANSITIONS, REQUIRES_REASON } from "../api/hardware.types";

// ── Constants ─────────────────────────────────────────────────────────────────

type ActionKey = "resync" | "diagnose" | DeviceStatusValue;

const TRANSITION_LABELS: Record<DeviceStatusValue, string> = {
  active:      "Return to Active",
  maintenance: "Set Maintenance",
  retired:     "Retire",
  offline:     "Set Offline",
};


const DIAGNOSIS_HEALTH_LABELS: Record<string, string> = {
  online:         "Device is online and reporting normally.",
  stale:          "Device is active but its heartbeat is overdue — it may not be responding.",
  offline:        "Device has lost connectivity and is no longer reporting to the system.",
  maintenance:    "Device is in scheduled maintenance.",
  decommissioned: "Device is retired and decommissioned.",
};

function diagnosisHealthLabel(health: string): string {
  return (
    DIAGNOSIS_HEALTH_LABELS[health] ??
    `Diagnostics complete — unexpected health status: "${health}".`
  );
}

// ── Row menu (three-dot trigger + dropdown) ───────────────────────────────────

interface DeviceActionsMenuProps {
  device: Device;
}

export default function DeviceActionsMenu({ device }: DeviceActionsMenuProps) {
  const { isAllowed } = useAuthz();
  const toast = useToast();
  const a = useDeviceActions(device.id);
  const transition = useTransitionDeviceStatus(device.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const canResync   = isAllowed({ anyPermission: ["hardware.resync"] });
  const canDiagnose = isAllowed({ anyPermission: ["hardware.diagnose"] });
  const canManage   = isAllowed({ anyPermission: ["hardware.manage"] });

  const currentStatus = device.status as DeviceStatusValue;
  const availableTransitions = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  const hasAnyAction =
    canResync || canDiagnose || (canManage && availableTransitions.length > 0);

  if (!hasAnyAction) return null;

  // ── Dropdown positioning — portal-rendered to escape CSS transform ancestors ─

  useEffect(() => {
    if (!menuOpen) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const right = Math.max(4, window.innerWidth - rect.right);
      // Flip above the button when there isn't enough room below
      const estimatedHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      setDropdownStyle({
        position: "fixed",
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        right,
        minWidth: 160,
        zIndex: 100010,
      });
    }
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBtn      = btnRef.current?.contains(target) ?? false;
      const insideDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!insideBtn && !insideDropdown) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Escape key closes menu
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  const pick = (action: ActionKey) => {
    setMenuOpen(false);
    setReason("");
    setReasonError(null);
    setPendingAction(action);
  };

  const closeDialog = () => {
    if (!submitting) setPendingAction(null);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    if (REQUIRES_REASON.includes(pendingAction as DeviceStatusValue)) {
      if (reason.trim() === "") { setReasonError("A reason is required."); return; }
      if (reason.length > 500)  { setReasonError("Reason must be 500 characters or fewer."); return; }
    }
    setReasonError(null);
    setSubmitting(true);
    try {
      let successMessage: string;
      if (pendingAction === "resync") {
        await a.resync.mutateAsync();
        successMessage = dialogConfig(pendingAction, device).successMessage;
      } else if (pendingAction === "diagnose") {
        const result = await a.diagnose.mutateAsync();
        successMessage = diagnosisHealthLabel(result.data.health);
      } else {
        await transition.mutateAsync({
          status: pendingAction as DeviceStatusValue,
          reason: REQUIRES_REASON.includes(pendingAction as DeviceStatusValue) ? reason : undefined,
        });
        successMessage = dialogConfig(pendingAction, device).successMessage;
      }
      toast.success(successMessage);
      setPendingAction(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const dropdown = (
    <div ref={dropdownRef} className="hw-row-menu-dropdown" role="menu" style={dropdownStyle}>
      {canResync && (
        <button type="button" className="hw-row-menu-item" onClick={() => pick("resync")}>
          Resync
        </button>
      )}
      {canDiagnose && (
        <button type="button" className="hw-row-menu-item" onClick={() => pick("diagnose")}>
          Diagnose
        </button>
      )}
      {canManage && availableTransitions.length > 0 && (
        <>
          {(canResync || canDiagnose) && <div className="hw-row-menu-divider" />}
          {availableTransitions.map((target) => (
            <button
              key={target}
              type="button"
              className={[
                "hw-row-menu-item",
                target === "retired" ? "hw-row-menu-item--danger" : "",
              ].join(" ").trim()}
              onClick={() => pick(target)}
            >
              {TRANSITION_LABELS[target]}
            </button>
          ))}
        </>
      )}
    </div>
  );

  return (
    <>
      {/* ── Three-dot trigger ─────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        type="button"
        className="hw-row-menu-btn"
        aria-label="Device actions"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5"  r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {/* Dropdown rendered at body level to escape any CSS transform ancestors */}
      {menuOpen && createPortal(dropdown, document.body)}

      {/* ── Confirmation dialog ───────────────────────────────────────────── */}
      {pendingAction && (() => {
        const cfg = dialogConfig(pendingAction, device);
        const needsReason = REQUIRES_REASON.includes(pendingAction as DeviceStatusValue);
        return (
          <ConfirmDialog
            open
            onClose={closeDialog}
            title={cfg.title}
            description={cfg.description}
            confirmLabel={cfg.confirmLabel}
            tone={cfg.tone}
            loading={submitting}
            onConfirm={handleConfirm}
          >
            {needsReason && (
              <div className="mt-3 flex flex-col gap-1">
                <label
                  htmlFor={`hw-reason-${device.id}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id={`hw-reason-${device.id}`}
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(null); }}
                  placeholder="Describe the reason for this status change…"
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-sm",
                    "bg-white dark:bg-gray-900",
                    "text-gray-900 dark:text-gray-100",
                    "placeholder-gray-400 dark:placeholder-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    reasonError
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-700",
                  ].join(" ")}
                />
                {reasonError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{reasonError}</p>
                )}
                <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
              </div>
            )}
          </ConfirmDialog>
        );
      })()}
    </>
  );
}

// ── Dialog config per action ──────────────────────────────────────────────────

function dialogConfig(
  action: ActionKey,
  device: Device,
): {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "primary" | "danger";
  successMessage: string;
} {
  const name = device.name ?? device.serial;
  switch (action) {
    case "resync":
      return { title: "Resync device?", description: `Push a fresh sync to "${name}".`, confirmLabel: "Resync", tone: "primary", successMessage: "Resync requested" };
    case "diagnose":
      return { title: "Run diagnostics?", description: `Run a diagnostic check on "${name}".`, confirmLabel: "Diagnose", tone: "primary", successMessage: "Diagnostics started" };
    case "maintenance":
      return { title: "Set Maintenance?", description: `Take "${name}" out of service for maintenance.`, confirmLabel: "Set Maintenance", tone: "primary", successMessage: "Device set to maintenance" };
    case "active":
      return { title: "Return to Active?", description: `Return "${name}" to active service.`, confirmLabel: "Return to Active", tone: "primary", successMessage: "Device returned to active" };
    case "retired":
      return { title: "Retire device?", description: `Permanently decommission "${name}". This cannot be undone.`, confirmLabel: "Retire", tone: "danger", successMessage: "Device retired" };
    default:
      return { title: "Confirm action", description: "", confirmLabel: "Confirm", tone: "primary", successMessage: "Done" };
  }
}
