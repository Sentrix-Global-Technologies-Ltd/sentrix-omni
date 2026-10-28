import { STATUS_OPTIONS } from "./assignmentTone";
import type { AssignmentFilters as Filters } from "../api/assignments.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/**
 * Assignment dispatch filters.
 *
 * Uses the same ic-filter-* CSS pattern as the Incidents Centre.
 * incidents-centre.css must be imported in the host page.
 *
 * SUPPORTED (wired to backend):
 *   - Status (status=pending|dispatching|partially_filled|filled|active|escalated|completed|cancelled)
 *
 * incident_id is a deep-link scope managed by the host page, not this component.
 */
export default function AssignmentFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status);

  return (
    <div className="ic-filter-row">
      <span className="ic-filter-label">Filters:</span>

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

      {hasFilters && (
        <button
          type="button"
          className="ic-filter-clear"
          onClick={onClear}
          aria-label="Clear status filter"
        >
          Clear
        </button>
      )}
    </div>
  );
}
