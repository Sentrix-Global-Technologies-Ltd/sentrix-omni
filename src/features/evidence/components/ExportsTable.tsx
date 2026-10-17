import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import type { Tone } from "../../../components/ui/tone";
import { formatDateTime, relativeTime } from "../../../lib/format";
import type { RetentionExport } from "../../retention/api/retention.types";

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

function formatTone(fmt: string): Tone {
  switch (fmt.toLowerCase()) {
    case "json": return "info";
    case "csv": return "success";
    case "zip": return "warning";
    case "pdf": return "error";
    default: return "light";
  }
}

interface Props {
  exports: RetentionExport[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export default function ExportsTable({ exports, isLoading, error, onRetry }: Props) {
  const columns: Column<RetentionExport>[] = [
    {
      key: "format",
      header: "Format",
      render: (e) => (
        <StatusBadge tone={formatTone(e.format)}>
          {e.format.toUpperCase()}
        </StatusBadge>
      ),
    },
    {
      key: "count",
      header: "Observations",
      headerClassName: "hidden sm:table-cell",
      className: "hidden sm:table-cell",
      render: (e) => (
        <div>
          <p className="tabular-nums font-medium text-gray-800 dark:text-white/90">
            {e.count.toLocaleString()}
          </p>
          <p className="mt-0.5 text-theme-xs text-gray-400">items</p>
        </div>
      ),
    },
    {
      key: "exported_by",
      header: "Exported by",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      render: (e) => {
        if (!e.exported_by) {
          return (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.05]">
                SY
              </span>
              System
            </span>
          );
        }
        const short = e.exported_by.slice(0, 8);
        return (
          <div className="flex items-center gap-2">
            <InitialsAvatar name={short} />
            <span className="font-mono text-xs text-gray-600 dark:text-gray-300">{short}…</span>
          </div>
        );
      },
    },
    {
      key: "created",
      header: "Exported",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      render: (e) => (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatDateTime(e.created_at)}
          </p>
          <p className="mt-0.5 text-theme-xs text-gray-400">
            {relativeTime(e.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) => {
        // Download the first manifest item's snapshot or clip, or the whole manifest
        const firstItem = e.manifest?.[0];
        const href = firstItem?.snapshot_url ?? firstItem?.clip_url ?? null;
        return (
          <div className="group/dl relative inline-flex" onClick={(ev) => ev.stopPropagation()}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label="Download export"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center text-gray-300 dark:text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </span>
            )}
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-theme-xs text-white opacity-0 transition-opacity duration-150 group-hover/dl:opacity-100 dark:bg-gray-700"
            >
              Download
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={exports}
      rowKey={(e) => e.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No exports yet"
      emptyDescription="Archive-first exports appear here once evidence is exported from the Retention Policy tab."
    />
  );
}
