import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, titleCase } from "./commandTone";
import type { CommandNode } from "../api/command.types";

interface Props {
  commands: CommandNode[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Command hierarchy (units) table — read-only. */
export default function CommandNodeTable({ commands, isLoading, error, onRetry }: Props) {
  const columns: Column<CommandNode>[] = [
    {
      key: "name",
      header: "Command",
      render: (c) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{c.name}</span>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (c) => <StatusBadge tone="info">{titleCase(c.tier)}</StatusBadge>,
    },
    {
      key: "area",
      header: "Area",
      render: (c) => <span className="text-gray-600 dark:text-gray-300">{c.area ?? "—"}</span>,
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
      rows={commands}
      rowKey={(c) => c.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No commands"
      emptyDescription="No command units match the current filters."
    />
  );
}
