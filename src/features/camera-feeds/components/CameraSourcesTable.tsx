import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { TrashBinIcon } from "../../../icons";
import { feedStatusLabel, feedStatusTone, relativeTime } from "./feedStatusTone";
import { cameraSourceTypeLabel } from "./cameraSourceTypeMeta";
import type { CameraSource } from "../api/camera-feeds.types";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";

interface Props {
  sources: CameraSource[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (source: CameraSource) => void;
  onDelete?: (source: CameraSource) => void;
}

function healthTone(score: number | null): "success" | "warning" | "error" | "light" {
  if (score === null) return "light";
  if (score >= 80) return "success";
  if (score >= 40) return "warning";
  return "error";
}

/** Row thumbnail of the source's private live frame (fetched with the bearer
 * token; a render callback can't call hooks, hence a tiny component). */
function FrameThumb({ source }: { source: CameraSource }) {
  const { src } = useAuthenticatedImage(source.last_frame_url, source.last_frame_at);

  return src ? (
    <img src={src} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="text-theme-xs text-gray-400">—</span>
  );
}

/** Rich Camera Sources table: type, site/zone, connection, health (derived
 * recency heuristic — see CameraSource::healthScore()), and admin tags. */
export default function CameraSourcesTable({ sources, isLoading, error, onRetry, onRowClick, onDelete }: Props) {
  const columns: Column<CameraSource>[] = [
    {
      key: "label",
      header: "Source Name",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
            <FrameThumb source={s} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800 dark:text-white/90">{s.label}</p>
            <p className="truncate text-theme-xs text-gray-400">{s.connection_url ?? s.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Source Type",
      render: (s) => <span className="text-gray-500 dark:text-gray-400">{cameraSourceTypeLabel(s.type)}</span>,
    },
    {
      key: "location",
      header: "Site / Location",
      render: (s) => (
        <div>
          <p className="text-gray-700 dark:text-gray-200">{s.site ?? "—"}</p>
          <p className="text-theme-xs text-gray-400">{s.zone ?? ""}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge tone={feedStatusTone(s.feed_status)}>{feedStatusLabel(s.feed_status)}</StatusBadge>,
    },
    {
      key: "health",
      header: "Health",
      render: (s) => (
        <div className="flex items-center gap-2">
          <StatusBadge tone={healthTone(s.health_score)}>
            {s.health_score === null ? "No signal" : `${s.health_score}%`}
          </StatusBadge>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {(s.tags ?? []).length === 0 ? (
            <span className="text-theme-xs text-gray-400">—</span>
          ) : (
            s.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300"
              >
                {tag}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "last_frame",
      header: "Last Frame",
      render: (s) => (
        <span className="text-theme-xs text-gray-400">
          {s.last_frame_at ? relativeTime(s.last_frame_at) : "Never"}
        </span>
      ),
    },
    ...(onDelete
      ? [
          {
            key: "actions",
            header: "",
            render: (s: CameraSource) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s);
                }}
                className="rounded-md p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                aria-label={`Remove ${s.label}`}
              >
                <TrashBinIcon className="size-4" />
              </button>
            ),
          } as Column<CameraSource>,
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={sources}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onRowClick}
      emptyTitle="No camera sources"
      emptyDescription="Add a camera source to start monitoring this organization's feeds."
    />
  );
}
