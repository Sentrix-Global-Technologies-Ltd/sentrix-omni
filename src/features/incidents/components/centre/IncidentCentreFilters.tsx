import type { ReactNode } from "react";
import type { IncidentCentreFilters as FiltersShape } from "../../api/incidents.types";
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from "../incidentTone";

interface IncidentCentreFiltersProps {
  filters: FiltersShape;
  onChange: (next: Partial<FiltersShape>) => void;
  onClear: () => void;
}

/**
 * Filter row for the Incidents Centre.
 *
 * SUPPORTED (wired to backend query params):
 *   - Severity  (severity=low|medium|high|critical)
 *   - Status    (status=open|investigating|escalated|resolved|closed)
 *
 * UNAVAILABLE (no backend filter support):
 *   - Type, Site, Responder — clearly marked as unavailable with a dashed
 *     border and an "API" badge. They are NOT applied client-side.
 *     Separate backend enhancements are required before enabling these.
 */
export default function IncidentCentreFilters({
  filters,
  onChange,
  onClear,
}: IncidentCentreFiltersProps): ReactNode {
  const hasActiveFilter = filters.severity || filters.status;

  return (
    <div className="ic-filter-row">
      <span className="ic-filter-label">Filters:</span>

      {/* ── Severity — supported ────────────────────────────── */}
      <select
        className="ic-filter-select"
        value={filters.severity ?? ""}
        onChange={(e) => onChange({ severity: e.target.value || undefined, page: undefined })}
        aria-label="Filter by severity"
      >
        <option value="">All severities</option>
        {SEVERITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* ── Status — supported ──────────────────────────────── */}
      <select
        className="ic-filter-select"
        value={filters.status ?? ""}
        onChange={(e) => onChange({ status: e.target.value || undefined, page: undefined })}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* ── Type — unavailable ──────────────────────────────── */}
      <span
        className="ic-filter-unavailable"
        title="Type filtering requires backend API support. Not yet available."
        aria-disabled="true"
      >
        Type
        <span className="ic-filter-unavailable-badge">API</span>
      </span>

      {/* ── Site — unavailable ──────────────────────────────── */}
      <span
        className="ic-filter-unavailable"
        title="Site filtering requires backend API support. Not yet available."
        aria-disabled="true"
      >
        Site
        <span className="ic-filter-unavailable-badge">API</span>
      </span>

      {/* ── Responder — unavailable ─────────────────────────── */}
      <span
        className="ic-filter-unavailable"
        title="Responder filtering requires backend API support. Not yet available."
        aria-disabled="true"
      >
        Responder
        <span className="ic-filter-unavailable-badge">API</span>
      </span>

      {hasActiveFilter && (
        <button
          type="button"
          className="ic-filter-clear"
          onClick={onClear}
          aria-label="Clear all filters"
        >
          Clear
        </button>
      )}
    </div>
  );
}
