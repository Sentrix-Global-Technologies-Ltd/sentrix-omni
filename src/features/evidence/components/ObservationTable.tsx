import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import ObservationActions from "./ObservationActions";
import { relativeTime, retentionTone, severityTone, titleCase } from "./evidenceTone";
import type { Observation } from "../api/evidence.types";

interface Props {
  observations: Observation[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Evidence observation table (read + per-row actions). */
export default function ObservationTable({ observations, isLoading, error, onRetry }: Props) {
  const columns: Column<Observation>[] = [
    {
      key: "observation",
      header: "Observation",
      render: (o) => (
        <div className="flex items-center gap-3">
          {o.snapshot_url ? (
            <img
              src={o.snapshot_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-theme-xs text-gray-400 dark:bg-white/5">
              {titleCase(o.kind).slice(0, 3)}
            </span>
          )}
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {o.label ?? titleCase(o.kind)}
            </p>
            <p className="mt-0.5 text-theme-xs text-gray-400">{titleCase(o.kind)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plate",
      header: "Plate",
      render: (o) => (
        <span className="font-mono text-theme-sm text-gray-700 dark:text-gray-200">
          {o.plate ?? "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (o) =>
        o.severity ? (
          <StatusBadge tone={severityTone(o.severity)}>{titleCase(o.severity)}</StatusBadge>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (o) => (
        <span className="tabular-nums text-gray-600 dark:text-gray-300">
          {o.confidence != null ? `${Math.round(o.confidence * 100)}%` : "—"}
        </span>
      ),
    },
    {
      key: "flags",
      header: "Status",
      render: (o) => (
        <div className="flex flex-wrap gap-1">
          {o.hold && <StatusBadge tone="error">Hold</StatusBadge>}
          {o.bookmarked && <StatusBadge tone="info">Bookmarked</StatusBadge>}
          {o.sealed && <StatusBadge tone="light">Sealed</StatusBadge>}
          <StatusBadge tone={retentionTone(o.retention_tier)}>{titleCase(o.retention_tier)}</StatusBadge>
        </div>
      ),
    },
    {
      key: "observed",
      header: "Observed",
      render: (o) => (
        <span className="text-gray-500 dark:text-gray-400">{relativeTime(o.observed_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => <ObservationActions observation={o} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={observations}
      rowKey={(o) => o.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No observations"
      emptyDescription="No evidence matches the current filters."
    />
  );
}
