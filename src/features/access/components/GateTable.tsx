import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { formatDateTime, gateResultTone, titleCase } from "./accessTone";
import type { GateEvent } from "../api/access.types";

interface Props {
  events: GateEvent[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Gate event log table. */
export default function GateTable({ events, isLoading, error, onRetry }: Props) {
  const columns: Column<GateEvent>[] = [
    {
      key: "visitor",
      header: "Visitor",
      render: (e) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{e.visitor_name ?? "—"}</span>
      ),
    },
    {
      key: "gate",
      header: "Gate",
      render: (e) => <span className="text-gray-600 dark:text-gray-300">{e.gate ?? "—"}</span>,
    },
    {
      key: "direction",
      header: "Direction",
      render: (e) => <span className="text-gray-600 dark:text-gray-300">{titleCase(e.direction)}</span>,
    },
    {
      key: "result",
      header: "Result",
      render: (e) => <StatusBadge tone={gateResultTone(e.result)}>{titleCase(e.result)}</StatusBadge>,
    },
    {
      key: "recorded",
      header: "When",
      render: (e) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDateTime(e.recorded_at)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={events}
      rowKey={(e) => e.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No gate events"
      emptyDescription="No gate activity matches the current filters."
    />
  );
}
