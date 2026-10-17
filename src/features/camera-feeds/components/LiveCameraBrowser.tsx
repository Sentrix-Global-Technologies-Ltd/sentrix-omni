import type { CameraSource, FeedStatus } from "../api/camera-feeds.types";

interface Props {
  sources: CameraSource[];
  selectedId: string | null;
  onSelect: (source: CameraSource) => void;
  onClose: () => void;
}

function dotClass(status: FeedStatus): string {
  return `lm-browser-item-dot lm-browser-item-dot--${status}`;
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/**
 * Camera browser side panel — absolute overlay on the left of the grid area.
 * Groups cameras by site. Clicking a camera selects it (highlighted in the
 * grid) and the details panel on the right rail updates.
 */
export default function LiveCameraBrowser({ sources, selectedId, onSelect, onClose }: Props) {
  // Group sources by site (null/empty → "Unassigned")
  const groups = new Map<string, CameraSource[]>();
  for (const s of sources) {
    const key = s.site?.trim() || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="lm-browser-panel" role="navigation" aria-label="Camera browser">
      <div className="lm-browser-header">
        <span className="lm-browser-title">Cameras</span>
        <button className="lm-browser-close" onClick={onClose} aria-label="Close browser">
          <CloseIcon />
        </button>
      </div>

      {Array.from(groups.entries()).map(([site, cams]) => (
        <div key={site}>
          <div className="lm-browser-group-label">{site}</div>
          {cams.map((cam) => (
            <div
              key={cam.id}
              className={`lm-browser-item${cam.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(cam)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(cam)}
              aria-pressed={cam.id === selectedId}
            >
              <span className={dotClass(cam.feed_status)} aria-hidden="true" />
              <span className="lm-browser-item-label" title={cam.label}>{cam.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
