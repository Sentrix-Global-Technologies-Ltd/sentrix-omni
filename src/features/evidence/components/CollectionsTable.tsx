import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, relativeTime } from "../../../lib/format";
import type { EvidenceCollection } from "../api/evidence.types";

/** Initials avatar — consistent with the TailAdmin pattern used across feature tables. */
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
      {initials}
    </span>
  );
}

interface Props {
  collections: EvidenceCollection[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onOpen: (collection: EvidenceCollection) => void;
}

export default function CollectionsTable({ collections, isLoading, error, onRetry, onOpen }: Props) {
  const columns: Column<EvidenceCollection>[] = [
    {
      key: "name",
      header: "Collection",
      render: (c) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>
          {c.description && (
            <p className="mt-0.5 max-w-xs truncate text-theme-xs text-gray-400">
              {c.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "count",
      header: "Items",
      headerClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      render: (c) => {
        const n = c.observations_count ?? 0;
        return (
          <StatusBadge tone={n === 0 ? "light" : n > 50 ? "warning" : "info"}>
            {n.toLocaleString()}
          </StatusBadge>
        );
      },
    },
    {
      key: "creator",
      header: "Created by",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (c) =>
        c.creator_name ? (
          <div className="flex items-center gap-2">
            <InitialsAvatar name={c.creator_name} />
            <span className="text-sm text-gray-600 dark:text-gray-300">{c.creator_name}</span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-600">—</span>
        ),
    },
    {
      key: "created",
      header: "Created",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      render: (c) => (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatDateTime(c.created_at)}
          </p>
          <p className="mt-0.5 text-theme-xs text-gray-400">
            {relativeTime(c.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div
          className="group/open relative inline-flex"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(c);
          }}
        >
          <button
            aria-label="Open collection"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
          >
            {/* Eye icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-theme-xs text-white opacity-0 transition-opacity duration-150 group-hover/open:opacity-100 dark:bg-gray-700"
          >
            Open
          </span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={collections}
      rowKey={(c) => c.id}
      onRowClick={onOpen}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No collections yet"
      emptyDescription="Group related observations into a case file to keep them together."
    />
  );
}
