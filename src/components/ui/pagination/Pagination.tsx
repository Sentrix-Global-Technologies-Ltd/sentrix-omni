import Button from "../button/Button";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total?: number;
  from?: number;
  to?: number;
  onPageChange: (page: number) => void;
}

/** Shared pagination driven by Laravel paginator meta. */
export default function Pagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {from != null && to != null && total != null
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${currentPage} of ${lastPage}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {currentPage} / {lastPage}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
