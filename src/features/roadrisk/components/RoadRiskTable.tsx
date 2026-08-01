import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { formatDateTime, roadRiskBandTone, roadRiskTrendLabel } from "./roadRiskTone";
import type { RoadSegment } from "../api/road-risk.types";

interface Props {
  segments: RoadSegment[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (segment: RoadSegment) => void;
  onRecompute: (segment: RoadSegment) => void;
  recomputingId?: string | null;
}

/** Sentrix Console — curated road-segment safety scoring feed. */
export default function RoadRiskTable({ segments, isLoading, error, onRetry, onRowClick, onRecompute, recomputingId }: Props) {
  const columns: Column<RoadSegment>[] = [
    {
      key: "name",
      header: "Segment",
      render: (s) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{s.name}</p>
          <p className="text-theme-xs text-gray-400">{s.area ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (s) => (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {s.score !== null ? `${s.score}/100` : "Not yet scored"}
        </span>
      ),
    },
    {
      key: "band",
      header: "Band",
      render: (s) => (
        <StatusBadge tone={roadRiskBandTone(s.band)}>{s.band_label ?? "Pending"}</StatusBadge>
      ),
    },
    {
      key: "trend",
      header: "Trend",
      render: (s) => (
        <span className="text-gray-500 dark:text-gray-400">{roadRiskTrendLabel(s.trend)}</span>
      ),
    },
    {
      key: "factors",
      header: "Top factors",
      render: (s) => (
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {s.factors.length > 0 ? s.factors[0] : "No recent reports"}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (s) => (
        <StatusBadge tone={s.active ? "success" : "light"}>{s.active ? "Active" : "Inactive"}</StatusBadge>
      ),
    },
    {
      key: "computed_at",
      header: "Last scored",
      render: (s) => (
        <span className="text-gray-500 dark:text-gray-400">{s.computed_at ? formatDateTime(s.computed_at) : "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <Can permission="roadrisk.manage">
          {/* Button's onClick has no event param (see components/ui/button/Button.tsx),
              so stopPropagation happens on a wrapping element — same pattern used in
              ViewRowAction.tsx / MultiSelect.tsx for buttons inside a clickable row. */}
          <span onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              disabled={recomputingId === s.id}
              onClick={() => onRecompute(s)}
            >
              {recomputingId === s.id ? "Scoring…" : "Recompute"}
            </Button>
          </span>
        </Can>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={segments}
      rowKey={(s) => s.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No road segments"
      emptyDescription="Add a segment to start scoring a corridor."
    />
  );
}
