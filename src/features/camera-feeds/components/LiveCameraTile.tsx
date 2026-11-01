import { useRef } from "react";
import { useNavigate } from "react-router";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import type { CameraSource, FeedStatus } from "../api/camera-feeds.types";

interface Props {
  source: CameraSource;
  index: number;
  selected?: boolean;
  onSelect: () => void;
  onFullscreen: () => void;
  onOpenViewer: (source: CameraSource) => void;
}

function statusLabel(s: FeedStatus): string {
  switch (s) {
    case "live":    return "Live";
    case "stale":   return "Stale";
    case "offline": return "Offline";
    case "no_feed": return "No Feed";
    default:        return s;
  }
}

/** Inline SVG icons — no lucide-react */
function IconMaximize() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M21 8V5a2 2 0 00-2-2h-3"/>
      <path d="M3 16v3a2 2 0 002 2h3"/><path d="M16 21h3a2 2 0 002-2v-3"/>
    </svg>
  );
}
function IconCamera() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}
function IconVolumeX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
}

/**
 * Single camera tile for the Live Monitoring grid.
 *
 * - Authenticated image via useAuthenticatedImage (bearer token, re-fetches on last_frame_at change).
 * - CSS gradient placeholder shown until/unless a real frame loads.
 * - Never shows a broken <img>: src is only set when the hook resolved successfully.
 * - Fullscreen via browser Fullscreen API (real).
 * - Snapshot and mute are UI demonstrations (no backend capability) — clearly marked.
 */
export default function LiveCameraTile({ source, index, selected, onSelect, onFullscreen }: Props) {
  const { src } = useAuthenticatedImage(source.last_frame_url, source.last_frame_at);
  const navigate = useNavigate();
  const tileRef = useRef<HTMLDivElement>(null);

  const handleOpenViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vision-guard/live/${source.id}`);
  };

  const gradientIndex = index % 9;
  const feedStatus = source.feed_status;

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use browser Fullscreen API on the tile element (real capability)
    if (tileRef.current) {
      if (!document.fullscreenElement) {
        void tileRef.current.requestFullscreen().catch(() => {
          // Fallback: delegate to parent handler
          onFullscreen();
        });
      } else {
        void document.exitFullscreen();
      }
    }
  };

  const handleDemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Demo-only action — no real backend capability
  };

  return (
    <div
      ref={tileRef}
      className={`lm-tile${selected ? " selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-label={`Select camera ${source.label}`}
      aria-pressed={selected}
    >
      {/* Preview: clicking the image/video area opens the dedicated viewer */}
      <div
        className={`lm-tile-preview lm-tile-preview--${gradientIndex}`}
        onClick={handleOpenViewer}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/vision-guard/live/${source.id}`)}
        aria-label={`Open viewer for ${source.label}`}
        title="Open camera viewer"
        style={{ cursor: "pointer" }}
      >
        {src && (
          <img src={src} alt={source.label} />
        )}
      </div>

      {/* Status text overlay when no image and feed isn't live */}
      {!src && feedStatus !== "live" && (
        <div className="lm-tile-status-overlay">
          {feedStatus === "no_feed" ? "No feed configured" :
           feedStatus === "offline" ? "Camera offline" :
           "No recent frame"}
        </div>
      )}

      {/* Action buttons — top right */}
      <div className="lm-tile-actions">
        {/* Snapshot: demo only — no backend endpoint */}
        <button
          className="lm-tile-action-btn"
          title="Demo only"
          onClick={handleDemoClick}
          aria-label="Snapshot (demo)"
        >
          <IconCamera />
        </button>
        {/* Mute: demo only */}
        <button
          className="lm-tile-action-btn"
          title="Demo only"
          onClick={handleDemoClick}
          aria-label="Mute (demo)"
        >
          <IconVolumeX />
        </button>
        {/* Fullscreen: real browser API */}
        <button
          className="lm-tile-action-btn"
          title="Fullscreen"
          onClick={handleFullscreen}
          aria-label="Fullscreen"
        >
          <IconMaximize />
        </button>
      </div>

      {/* Bottom: name + status badge */}
      <div className="lm-tile-overlay">
        <span className="lm-tile-name">{source.label}</span>
        <span className={`lm-tile-status-badge lm-tile-status-badge--${feedStatus}`}>
          {statusLabel(feedStatus)}
        </span>
      </div>
    </div>
  );
}
