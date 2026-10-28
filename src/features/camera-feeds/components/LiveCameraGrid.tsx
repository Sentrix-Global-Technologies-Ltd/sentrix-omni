import { useNavigate } from "react-router";
import LiveCameraTile from "./LiveCameraTile";
import type { CameraSource, FeedStatus } from "../api/camera-feeds.types";

export type GridLayout = "list" | 1 | 2 | 4 | 6 | 8;

interface Props {
  sources: CameraSource[];
  layout: GridLayout;
  selectedId: string | null;
  onSelect: (source: CameraSource) => void;
  onFullscreen: (source: CameraSource) => void;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function feedDot(status: FeedStatus) {
  const map: Record<FeedStatus, string> = {
    live:    "#22c55e",
    stale:   "#f59e0b",
    offline: "#ef4444",
    no_feed: "#6b7280",
  };
  return map[status] ?? "#6b7280";
}

function statusLabel(s: FeedStatus) {
  switch (s) {
    case "live":    return "Live";
    case "stale":   return "Stale";
    case "offline": return "Offline";
    case "no_feed": return "No Feed";
    default:        return s;
  }
}

/** List-row component — compact horizontal row for list layout. */
function CameraListRow({ source, index }: { source: CameraSource; index: number }) {
  const navigate = useNavigate();
  const feedStatus = source.feed_status;
  const dot = feedDot(feedStatus);

  return (
    <div
      className="lm-list-row"
      onClick={() => navigate(`/vision-guard/live/${source.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/vision-guard/live/${source.id}`)}
      aria-label={`Open viewer for ${source.label}`}
    >
      <span className="lm-list-row-num">{index + 1}</span>
      <span className="lm-list-row-dot" style={{ background: dot }} aria-hidden="true" />
      <span className="lm-list-row-name">{source.label}</span>
      {source.site && (
        <span className="lm-list-row-site">{source.site}</span>
      )}
      <span className="lm-list-row-status">
        <span className={`lm-tile-status-badge lm-tile-status-badge--${feedStatus}`}>
          {statusLabel(feedStatus)}
        </span>
      </span>
      {source.last_frame_at && (
        <span className="lm-list-row-time">
          {new Date(source.last_frame_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      <span className="lm-list-row-arrow" aria-hidden="true">›</span>
    </div>
  );
}

/**
 * Responsive camera tile grid / list for the Live Monitoring workspace.
 *
 * layout "list" → all sources as compact rows
 * layout 1|2|4|6|8 → tile grid with that many visible slots
 */
export default function LiveCameraGrid({
  sources,
  layout,
  selectedId,
  onSelect,
  onFullscreen,
  isLoading,
  error,
  onRetry,
}: Props) {
  if (isLoading) {
    return (
      <div className="lm-grid-area">
        <div className="lm-loading">Loading cameras…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lm-grid-area">
        <div className="lm-error-box">
          <span>Failed to load camera feeds.</span>
          <button className="lm-retry-btn" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="lm-grid-area">
        <div className="lm-loading">No camera sources registered.</div>
      </div>
    );
  }

  /* ── List mode ──────────────────────────────────────────────────────────── */
  if (layout === "list") {
    return (
      <div className="lm-grid-area">
        <div className="lm-camera-list">
          {sources.map((source, i) => (
            <CameraListRow key={source.id} source={source} index={i} />
          ))}
        </div>
      </div>
    );
  }

  /* ── Grid mode ──────────────────────────────────────────────────────────── */
  const visible = sources.slice(0, layout);

  return (
    <div className="lm-grid-area">
      <div className={`lm-camera-grid lm-camera-grid--${layout}`}>
        {visible.map((source) => (
          <LiveCameraTile
            key={source.id}
            source={source}
            index={sources.indexOf(source)}
            selected={source.id === selectedId}
            onSelect={() => onSelect(source)}
            onFullscreen={() => onFullscreen(source)}
            onOpenViewer={() => onSelect(source)}
          />
        ))}
      </div>
    </div>
  );
}
