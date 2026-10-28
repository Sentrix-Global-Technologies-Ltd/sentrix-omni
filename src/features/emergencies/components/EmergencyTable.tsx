import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import {
  emergencyLabel,
  emergencySeverityTone,
  emergencyStatusTone,
  formatDateTime,
  titleCase,
} from "./emergencyTone";
import type { Emergency } from "../api/emergencies.types";

// ── Three-dot row menu ────────────────────────────────────────────────────────

type EmergencyActionKey = "acknowledge" | "resolve" | "cancel";

interface RowMenuProps {
  emergency: Emergency;
  onView: (e: Emergency) => void;
  onAction: (e: Emergency, action: EmergencyActionKey) => void;
}

function RowMenu({ emergency, onView, onAction }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 176;
      // Align the dropdown's right edge with the button's right edge.
      // Using left (explicit viewport x) rather than right to avoid
      // coordinate-space confusion when the table sits inside overflow
      // containers that may affect how browsers interpret `right` in
      // certain layout contexts.
      const left = Math.max(4, rect.right - dropdownWidth);
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 2,
        left,
        width: dropdownWidth,
        zIndex: 100010,
      });
    }

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const s = emergency.status;
  const canAcknowledge = s === "triggered";
  const canResolve = s !== "resolved" && s !== "cancelled";
  const canCancel = s !== "cancelled" && s !== "resolved";

  // The dropdown is portalled to document.body so it escapes the DataTable's
  // overflow-hidden / overflow-x-auto containers without any clipping.
  const dropdown = open
    ? createPortal(
        <div className="ic-row-menu-dropdown" style={dropdownStyle} role="menu">
          {/* View details — always first */}
          <button
            type="button"
            className="ic-row-menu-item"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => { setOpen(false); onView(emergency); }}
          >
            View details
          </button>

          {/* Acknowledge — only for triggered */}
          {canAcknowledge && (
            <button
              type="button"
              className="ic-row-menu-item"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onAction(emergency, "acknowledge"); }}
            >
              Acknowledge
            </button>
          )}

          {/* Resolve — not already resolved/cancelled */}
          {canResolve && (
            <button
              type="button"
              className="ic-row-menu-item"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onAction(emergency, "resolve"); }}
            >
              Resolve
            </button>
          )}

          {/* Cancel — not already cancelled/resolved */}
          {canCancel && (
            <button
              type="button"
              className="ic-row-menu-item ic-row-menu-item--danger"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onAction(emergency, "cancel"); }}
            >
              Cancel emergency
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="ic-row-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="ic-row-menu-btn"
        aria-label="Emergency row actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5"  r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {dropdown}
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface Props {
  emergencies: Emergency[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Row click — opens the detail drawer for the selected emergency. */
  onRowClick: (emergency: Emergency) => void;
  /** Actions column: "View details" opens the drawer. */
  onView: (emergency: Emergency) => void;
  /** Emergency coordination action (shows confirm dialog in the parent). */
  onAction: (emergency: Emergency, action: EmergencyActionKey) => void;
}

/** Emergency list table — supplies columns to the shared DataTable. */
export default function EmergencyTable({
  emergencies,
  isLoading,
  error,
  onRetry,
  onRowClick,
  onView,
  onAction,
}: Props) {
  const columns: Column<Emergency>[] = [
    {
      key: "emergency",
      header: "Emergency",
      render: (e) => (
        <p className="font-medium text-gray-800 dark:text-white/90">
          {emergencyLabel(e.message, e.id)}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <StatusBadge tone={emergencyStatusTone[e.status]}>
          {titleCase(e.status)}
        </StatusBadge>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (e) => (
        <StatusBadge tone={emergencySeverityTone[e.severity]}>
          {titleCase(e.severity)}
        </StatusBadge>
      ),
    },
    {
      key: "triggered_at",
      header: "Triggered",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDateTime(e.triggered_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) => (
        <RowMenu emergency={e} onView={onView} onAction={onAction} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={emergencies}
      rowKey={(e) => e.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No emergencies"
      emptyDescription="No emergencies match the current filters."
    />
  );
}
