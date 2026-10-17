import type { ReactNode } from "react";

interface ListToolbarProps {
  /** Client-side search string — filters the currently loaded page only. */
  search: string;
  onSearch: (val: string) => void;
  /** Visible row count after client-side filtering. */
  visibleCount: number;
  /** Server total from pagination meta (null while loading). */
  totalCount: number | null;
  isLoading: boolean;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  /** Optional realtime connection state. Omit to hide the indicator. */
  connected?: boolean;
  /** Placeholder for the search input. */
  placeholder?: string;
  /** aria-label for the refresh button. */
  refreshLabel?: string;
}

const PAGE_SIZES = [10, 25, 50];

/**
 * Generic search + meta toolbar shared across list pages.
 *
 * Matches the visual style of the Incidents Centre toolbar. Search is
 * always client-side (over the currently loaded page) because most list
 * endpoints don't accept a free-text query param.
 */
export default function ListToolbar({
  search,
  onSearch,
  visibleCount,
  totalCount,
  isLoading,
  pageSize,
  onPageSizeChange,
  onRefresh,
  connected,
  placeholder = "Search this page…",
  refreshLabel = "Refresh",
}: ListToolbarProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <span className="pointer-events-none absolute left-2.5 text-gray-400">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label={placeholder}
        />
      </div>

      {/* Result count */}
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {isLoading
          ? "Loading…"
          : search
            ? `${visibleCount} match${visibleCount !== 1 ? "es" : ""} on page`
            : totalCount !== null
              ? `${totalCount.toLocaleString()} total`
              : `${visibleCount} on page`}
      </span>

      {/* Realtime dot */}
      {connected !== undefined && (
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"}`}
          title={connected ? "Realtime: connected" : "Realtime: disconnected"}
          aria-label={connected ? "Realtime connected" : "Realtime disconnected"}
        />
      )}

      {/* Refresh */}
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label={refreshLabel}
        title={refreshLabel}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>

      {/* Page size */}
      <select
        className="h-7 shrink-0 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        aria-label="Rows per page"
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>
            {n} / page
          </option>
        ))}
      </select>
    </div>
  );
}
