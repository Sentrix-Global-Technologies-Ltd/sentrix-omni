import type { ReactNode } from "react";

interface IncidentSearchToolbarProps {
  /** Client-side search string — filters the currently loaded page only. */
  search: string;
  onSearch: (val: string) => void;
  /** Result count displayed next to the search box. */
  visibleCount: number;
  totalCount: number | null;
  isLoading: boolean;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  connected: boolean;
}

const PAGE_SIZES = [10, 25, 50];

/**
 * Search + meta toolbar sitting above the incidents table.
 *
 * Search note: filtering is client-side over the current page because the
 * backend incidents list endpoint does not accept a search/q param. The
 * count displayed shows visible vs. current-page rows, not server totals,
 * and it is labelled accordingly to be transparent to the operator.
 */
export default function IncidentSearchToolbar({
  search,
  onSearch,
  visibleCount,
  totalCount,
  isLoading,
  pageSize,
  onPageSizeChange,
  onRefresh,
  connected,
}: IncidentSearchToolbarProps): ReactNode {
  return (
    <div className="ic-toolbar">
      {/* Search — client-side over loaded page */}
      <div className="ic-search-wrap">
        {/* Magnifier icon */}
        <span className="ic-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          className="ic-search-input"
          placeholder="Search this page…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search incidents on this page"
        />
      </div>

      {/* Result count */}
      <span className="ic-toolbar-count">
        {isLoading
          ? "Loading…"
          : search
            ? `${visibleCount} match${visibleCount !== 1 ? "es" : ""} on page`
            : totalCount !== null
              ? `${totalCount.toLocaleString()} total`
              : `${visibleCount} on page`}
      </span>

      {/* Realtime indicator */}
      <span
        className={`ic-realtime-dot${connected ? "" : " ic-realtime-dot--off"}`}
        title={connected ? "Realtime: connected" : "Realtime: disconnected"}
        aria-label={connected ? "Realtime connected" : "Realtime disconnected"}
      />

      {/* Refresh */}
      <button
        type="button"
        className="ic-icon-btn"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh incidents"
        title="Refresh"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>

      {/* Page size */}
      <select
        className="ic-page-size-select"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        aria-label="Rows per page"
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
      </select>
    </div>
  );
}
