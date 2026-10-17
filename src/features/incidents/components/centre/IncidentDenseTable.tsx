import { useState, useRef, useEffect, type ReactNode } from "react";
import type { Incident } from "../../api/incidents.types";
import { formatDateTime, riskTone } from "../incidentTone";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEV_LABELS: Record<Incident["severity"], string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

function SeverityBadge({ severity }: { severity: Incident["severity"] }) {
  return (
    <span
      className={`ic-sev-badge ic-sev-badge--${severity}`}
      aria-label={`Severity: ${SEV_LABELS[severity]}`}
    >
      {SEV_LABELS[severity]}
    </span>
  );
}

function StatusPill({ status }: { status: Incident["status"] }) {
  const labels: Record<Incident["status"], string> = {
    open: "Open",
    investigating: "Investigating",
    escalated: "Escalated",
    resolved: "Resolved",
    closed: "Closed",
  };
  return (
    <span className={`ic-status-pill ic-status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

function RiskBadge({ score }: { score: number | null | undefined }) {
  if (score === undefined) return <span className="ic-risk-badge ic-risk-badge--none">—</span>;
  if (score === null)      return <span className="ic-risk-badge ic-risk-badge--none">—</span>;

  const tone = riskTone(score);
  const cls =
    tone === "error"   ? "ic-risk-badge--critical"
    : tone === "warning" ? "ic-risk-badge--high"
    : "ic-risk-badge--low";

  return <span className={`ic-risk-badge ${cls}`}>{score}</span>;
}

// ── Three-dot row menu ────────────────────────────────────────────────────────

interface RowMenuProps {
  incident: Incident;
  onView: (i: Incident) => void;
  onAction: (i: Incident, action: "investigate" | "escalate" | "resolve" | "close") => void;
}

function RowMenu({ incident, onView, onAction }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 168;
      // Clamp right so the dropdown never slides off the left edge of the viewport.
      const rightFromEdge = Math.max(4, window.innerWidth - rect.right);
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 2,
        right: rightFromEdge,
        minWidth: dropdownWidth,
        zIndex: 100010,
      });
    }

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const item = (
    label: string,
    action: Parameters<RowMenuProps["onAction"]>[1],
    danger = false,
    disabled = false,
  ) => (
    <button
      key={action}
      type="button"
      className={`ic-row-menu-item${danger ? " ic-row-menu-item--danger" : ""}`}
      disabled={disabled}
      onClick={() => {
        setOpen(false);
        onAction(incident, action);
      }}
    >
      {label}
    </button>
  );

  const s = incident.status;

  return (
    <div className="ic-row-menu" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        className="ic-row-menu-btn"
        aria-label="Row actions"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="ic-row-menu-dropdown" role="menu" style={dropdownStyle}>
          <button
            type="button"
            className="ic-row-menu-item"
            onClick={() => { setOpen(false); onView(incident); }}
          >
            View details
          </button>
          {item("Investigate",  "investigate", false, s !== "open")}
          {item("Escalate",     "escalate",    false, s !== "open" && s !== "investigating")}
          {item("Resolve",      "resolve",     false, s === "resolved" || s === "closed")}
          {item("Close",        "close",       true,  s === "closed")}
        </div>
      )}
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface IncidentDenseTableProps {
  incidents: Incident[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (all: boolean) => void;
  onRowClick: (incident: Incident) => void;
  onRowAction: (incident: Incident, action: "investigate" | "escalate" | "resolve" | "close") => void;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

/**
 * Dense incidents table with checkbox multi-select and a three-dot row menu.
 * Row menu actions open via the parent-supplied `onRowAction` handler which
 * should open ConfirmActionButton dialogs — action confirmation is NOT inlined
 * here to avoid deep nesting.
 */
export default function IncidentDenseTable({
  incidents,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onRowClick,
  onRowAction,
  isLoading,
  error,
  onRetry,
}: IncidentDenseTableProps): ReactNode {
  const allSelected = incidents.length > 0 && incidents.every((i) => selectedIds.has(i.id));
  const someSelected = !allSelected && incidents.some((i) => selectedIds.has(i.id));

  return (
    <div className="ic-table-wrap">
      {isLoading && (
        <div className="ic-table-empty" role="status" aria-live="polite">
          Loading incidents…
        </div>
      )}

      {!isLoading && error && (
        <div className="ic-table-empty" role="alert">
          <p>Failed to load incidents.</p>
          <button type="button" className="ic-bulk-btn" style={{ margin: "0.5rem auto" }} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && incidents.length === 0 && (
        <div className="ic-table-empty">
          No incidents match the current filters.
        </div>
      )}

      {!isLoading && !error && incidents.length > 0 && (
        <table className="ic-table" aria-label="Incidents">
          <thead>
            <tr>
              <th className="ic-col-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  aria-label="Select all incidents on this page"
                />
              </th>
              <th className="ic-col-id">ID</th>
              <th className="ic-col-title">Type</th>
              <th className="ic-col-site">Site</th>
              <th className="ic-col-sev">Severity</th>
              <th className="ic-col-status">Status</th>
              <th className="ic-col-risk">Risk</th>
              <th className="ic-col-opened">Opened</th>
              <th className="ic-col-menu">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => {
              const selected = selectedIds.has(incident.id);
              return (
                <tr
                  key={incident.id}
                  className={selected ? "ic-row--selected" : ""}
                  onClick={() => onRowClick(incident)}
                  aria-selected={selected}
                >
                  <td className="ic-col-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(incident.id)}
                      aria-label={`Select incident ${incident.id}`}
                    />
                  </td>
                  <td className="ic-col-id">
                    <span className="ic-id-badge">
                      {incident.id.slice(0, 13)}
                    </span>
                  </td>
                  <td className="ic-col-title">
                    <div className="ic-title-cell">
                      <span className="ic-title-main">{incident.title}</span>
                      {incident.summary && (
                        <span className="ic-title-sub">{incident.summary}</span>
                      )}
                    </div>
                  </td>
                  <td className="ic-col-site">
                    <span className="ic-site-cell">—</span>
                  </td>
                  <td className="ic-col-sev">
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td className="ic-col-status">
                    <StatusPill status={incident.status} />
                  </td>
                  <td className="ic-col-risk">
                    <RiskBadge score={incident.risk_score} />
                  </td>
                  <td className="ic-col-opened">
                    {incident.opened_at ? formatDateTime(incident.opened_at) : "—"}
                  </td>
                  <td className="ic-col-menu" onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      incident={incident}
                      onView={onRowClick}
                      onAction={onRowAction}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
