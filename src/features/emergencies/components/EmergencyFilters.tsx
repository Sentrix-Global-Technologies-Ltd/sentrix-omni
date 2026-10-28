import { STATUS_OPTIONS, SEVERITY_OPTIONS } from "./emergencyTone";
import type { EmergencyFilters as Filters } from "../api/emergencies.types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}

/**
 * Emergency filters — uses the same ic-filter-* CSS classes as the Incidents
 * Centre filters (incidents-centre.css, imported by EmergencyListPage).
 */
export default function EmergencyFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Boolean(filters.status || filters.severity);

  return (
    <div className="ic-filter-row">
      <span className="ic-filter-label">Filters:</span>

      {/* ── Status — supported ──────────────────────────────── */}
      <select
        className="ic-filter-select"
        value={filters.status ?? ""}
        onChange={(e) => onChange({ status: e.target.value || undefined })}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* ── Severity — supported ────────────────────────────── */}
      <select
        className="ic-filter-select"
        value={filters.severity ?? ""}
        onChange={(e) => onChange({ severity: e.target.value || undefined })}
        aria-label="Filter by severity"
      >
        <option value="">All severities</option>
        {SEVERITY_OPTIONS.map((o) => (
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
