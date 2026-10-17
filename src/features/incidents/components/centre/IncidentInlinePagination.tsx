import type { ReactNode } from "react";

interface IncidentInlinePaginationProps {
  currentPage: number;
  lastPage: number;
  total: number | undefined;
  from: number | undefined;
  to: number | undefined;
  onPageChange: (page: number) => void;
}

/**
 * Compact inline pagination bar for the Incidents Centre.
 * Shows info text and page buttons with ellipsis for large page counts.
 */
export default function IncidentInlinePagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}: IncidentInlinePaginationProps): ReactNode {
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
    <div className="ic-pagination" role="navigation" aria-label="Incidents pagination">
      <span className="ic-pagination-info">{infoText}</span>

      <div className="ic-pagination-btns">
        {/* Previous */}
        <button
          type="button"
          className="ic-page-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          {/* Chevron left */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="ic-page-btn"
              style={{ cursor: "default", opacity: 0.5 }}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`ic-page-btn${p === currentPage ? " ic-page-btn--active" : ""}`}
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
          className="ic-page-btn"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          {/* Chevron right */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
