import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { assignmentStatusTone, formatDateTime, humanize } from "./assignmentTone";
import type { Assignment } from "../api/assignments.types";

// ── Three-dot row menu ────────────────────────────────────────────────────────

interface RowMenuProps {
  assignment: Assignment;
  onView: (a: Assignment) => void;
  /** Omit on read-only summaries (e.g. the dashboard): the action is then not offered. */
  onComplete?: (a: Assignment) => void;
  onCancel?: (a: Assignment) => void;
}

function RowMenu({ assignment, onView, onComplete, onCancel }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 168;
      // Align the dropdown's right edge with the button's right edge.
      // Use explicit left (viewport x) so the calculation is immune to
      // any overflow-hidden / overflow-x-auto ancestor in DataTable.
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

  const isTerminal = ["completed", "cancelled"].includes(assignment.status);

  return (
    <div className="ic-row-menu">
      <button
        ref={btnRef}
        type="button"
        className="ic-row-menu-btn"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && createPortal(
        <div
          className="ic-row-menu-dropdown"
          ref={ref}
          role="menu"
          style={dropdownStyle}
        >
          <button
            type="button"
            className="ic-row-menu-item"
            onClick={() => {
              setOpen(false);
              onView(assignment);
            }}
          >
            View details
          </button>
          {!isTerminal && onComplete && (
            <button
              type="button"
              className="ic-row-menu-item"
              onClick={() => {
                setOpen(false);
                onComplete(assignment);
              }}
            >
              Mark complete
            </button>
          )}
          {!isTerminal && onCancel && (
            <button
              type="button"
              className="ic-row-menu-item ic-row-menu-item--danger"
              onClick={() => {
                setOpen(false);
                onCancel(assignment);
              }}
            >
              Cancel
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

interface Props {
  assignments: Assignment[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onView: (assignment: Assignment) => void;
  /** Omit on read-only summaries (e.g. the dashboard): the action is then not offered. */
  onComplete?: (assignment: Assignment) => void;
  onCancel?: (assignment: Assignment) => void;
}

/** Assignment list table — row click or "View details" opens the side drawer. */
export default function AssignmentTable({
  assignments,
  isLoading,
  error,
  onRetry,
  onView,
  onComplete,
  onCancel,
}: Props) {
  const columns: Column<Assignment>[] = [
    {
      key: "assignment",
      header: "Assignment",
      render: (a) => (
        <p className="font-medium text-gray-800 dark:text-white/90">
          {a.id.slice(0, 8)}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <StatusBadge tone={assignmentStatusTone[a.status]}>
          {humanize(a.status)}
        </StatusBadge>
      ),
    },
    {
      key: "responders",
      header: "Responders",
      render: (a) => (
        <span className="text-gray-600 dark:text-gray-300">
          {(a.responders?.length ?? 0)} /{" "}
          {a.required_primary + a.required_supporting}
        </span>
      ),
    },
    {
      key: "escalation",
      header: "Escalation",
      render: (a) => (
        <span className="text-gray-600 dark:text-gray-300">
          L{a.escalation_level}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (a) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDateTime(a.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <div onClick={(e) => e.stopPropagation()}>
          <RowMenu
            assignment={a}
            onView={onView}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={assignments}
      rowKey={(a) => a.id}
      onRowClick={onView}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No assignments"
      emptyDescription="No assignments match the current filters."
    />
  );
}
