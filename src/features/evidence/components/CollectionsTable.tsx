import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import { formatDateTime } from "./evidenceTone";
import type { EvidenceCollection } from "../api/evidence.types";

interface Props {
  collections: EvidenceCollection[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onOpen: (collection: EvidenceCollection) => void;
}

/** Evidence Collections (case files) list — click a row to open its detail. */
export default function CollectionsTable({ collections, isLoading, error, onRetry, onOpen }: Props) {
  const columns: Column<EvidenceCollection>[] = [
    {
      key: "name",
      header: "Collection",
      render: (c) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>
          {c.description && (
            <p className="mt-0.5 max-w-md truncate text-theme-xs text-gray-400">{c.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "count",
      header: "Observations",
      render: (c) => (
        <span className="tabular-nums text-gray-600 dark:text-gray-300">{c.observations_count ?? 0}</span>
      ),
    },
    {
      key: "creator",
      header: "Created by",
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">{c.creator_name ?? "—"}</span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (c) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(c.created_at)}</span>
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
