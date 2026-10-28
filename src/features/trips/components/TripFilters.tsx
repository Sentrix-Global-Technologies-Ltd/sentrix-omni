import { TRIP_STATUS_OPTIONS } from "./tripTone";
import type { TripFilters as Filters } from "../api/trips.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/**
 * Trip list filters.
 *
 * Uses the same ic-filter-* CSS pattern as the Incidents Centre.
 * incidents-centre.css must be imported in the host page.
 *
 * SUPPORTED (wired to backend):
 *   - Status (status=active|overdue|completed|cancelled)
 */
export default function TripFilters({ filters, onChange, onClear }: Props) {
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
        {TRIP_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          className="ic-filter-clear"
          onClick={onClear}
          aria-label="Clear filters"
        >
          Clear
        </button>
      )}
    </div>
  );
}
