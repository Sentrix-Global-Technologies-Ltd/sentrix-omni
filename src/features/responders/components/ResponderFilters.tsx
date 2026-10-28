import { STATUS_OPTIONS, ASSIGNABLE_OPTIONS } from "./responderTone";
import type { ResponderFilters as Filters } from "../api/responders.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/**
 * Responder roster filters.
 *
 * Uses the same ic-filter-* CSS pattern as the Incidents Centre.
 * incidents-centre.css must be imported in the host page.
 *
 * SUPPORTED (wired to backend):
 *   - Status    (status=available|engaged|off_duty|unavailable|suspended)
 *   - Assignable (assignable=1)
 */
export default function ResponderFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status || filters.assignable);

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

      {/* ── Availability — supported ────────────────────────── */}
      <select
        className="ic-filter-select"
        value={filters.assignable ?? ""}
        onChange={(e) => onChange({ assignable: e.target.value || undefined, page: undefined })}
        aria-label="Filter by availability"
      >
        <option value="">All responders</option>
        {ASSIGNABLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
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
