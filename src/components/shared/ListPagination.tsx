import type { ReactNode } from "react";

interface ListPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number | undefined;
  from: number | undefined;
  to: number | undefined;
  onPageChange: (page: number) => void;
}

/**
 * Compact inline pagination bar shared across list pages.
 * Matches the visual style of IncidentInlinePagination.
 */
export default function ListPagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}: ListPaginationProps): ReactNode {
  if (lastPage <= 1 && (total === undefined || total <= 0)) return null;

  // Build visible page numbers with ellipsis.
  const pages: (number | "…")[] = [];
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(lastPage - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < lastPage - 2) pages.push("…");
    pages.push(lastPage);
  }

  const infoText =
    from !== undefined && to !== undefined && total !== undefined
      ? `${from}–${to} of ${total.toLocaleString()}`
      : `Page ${currentPage} of ${lastPage}`;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
      role="navigation"
      aria-label="Pagination"
    >
      <span className="text-xs text-gray-500 dark:text-gray-400">{infoText}</span>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          className="flex h-7 min-w-[1.875rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-7 min-w-[1.875rem] items-center justify-center text-xs text-gray-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`flex h-7 min-w-[1.875rem] items-center justify-center rounded-lg border px-1.5 text-xs font-medium transition-colors ${
                p === currentPage
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              aria-current={p === currentPage ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => p !== currentPage && onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          className="flex h-7 min-w-[1.875rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
