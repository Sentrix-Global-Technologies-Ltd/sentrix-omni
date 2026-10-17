import LiveCameraTile from "./LiveCameraTile";
import type { CameraSource } from "../api/camera-feeds.types";

export type GridLayout = 1 | 2 | 4 | 9;

interface Props {
  sources: CameraSource[];
  layout: GridLayout;
  selectedId: string | null;
  onSelect: (source: CameraSource) => void;
  onFullscreen: (source: CameraSource) => void;
  showBrowser: boolean;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

/**
 * Responsive camera tile grid for the Live Monitoring workspace.
 *
 * Layout prop controls how many tiles are shown per row (1 / 2 / 4 / 9).
 * Slices the sources array so the grid doesn't overflow its container.
 */
export default function LiveCameraGrid({
  sources,
  layout,
  selectedId,
  onSelect,
  onFullscreen,
  showBrowser,
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

  // Show at most `layout` tiles at once
  const visible = sources.slice(0, layout);

  return (
    <div className="lm-grid-area" style={showBrowser ? { paddingLeft: "220px" } : undefined}>
      <div className={`lm-camera-grid lm-camera-grid--${layout}`}>
        {visible.map((source, i) => (
          <LiveCameraTile
            key={source.id}
            source={source}
            index={sources.indexOf(source)}
            selected={source.id === selectedId}
            onSelect={() => onSelect(source)}
            onFullscreen={() => onFullscreen(source)}
          />
        ))}
      </div>
    </div>
  );
}
