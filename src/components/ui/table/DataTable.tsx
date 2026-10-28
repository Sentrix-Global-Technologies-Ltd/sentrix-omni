import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./index";
import LoadingState from "../state/LoadingState";
import EmptyState from "../state/EmptyState";
import ErrorState from "../state/ErrorState";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingLabel?: string;
  /** Per-row extra className — used for selected-row highlighting etc. */
  rowClassName?: (row: T) => string | undefined;
}

/**
 * Shared data table: typed columns + integrated loading / error / empty states.
 * Built on the template Table primitives — feature tables supply columns only,
 * never a new table primitive (governance).
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  loadingLabel,
  rowClassName,
}: DataTableProps<T>) {
  // TanStack Query reports "no error" as `null` (not `undefined`), so guard for both.
  const hasError = error !== null && error !== undefined;
  const hasRows = !isLoading && !hasError && rows.length > 0;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`px-5 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {hasRows && (
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={[
                    onRowClick
                      ? "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      : undefined,
                    rowClassName?.(row),
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`px-5 py-4 text-sm text-gray-700 dark:text-gray-300 ${col.className ?? ""}`}
                    >
                      <div onClick={onRowClick ? () => onRowClick(row) : undefined}>
                        {col.render(row)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* States render full-width below the header. */}
      {isLoading && <LoadingState label={loadingLabel} />}
      {!isLoading && hasError && <ErrorState error={error as Error} onRetry={onRetry} />}
      {!isLoading && !hasError && rows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}
