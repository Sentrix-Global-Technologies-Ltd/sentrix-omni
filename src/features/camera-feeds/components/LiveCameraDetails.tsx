import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { relativeTime } from "./feedStatusTone";
import type { CameraSource } from "../api/camera-feeds.types";

interface Props {
  source: CameraSource | null;
}

// MOCK technical specs — not returned by the camera API, shown for UI completeness
const MOCK_SPECS = {
  resolution: "1920 × 1080 (1080p)",
  frameRate:  "30 FPS",
  bitrate:    "4.2 Mbps",
  aiDetect:   "Vehicle, Person",
  uptime:     "98.7%",
};

/** External link icon (no lucide-react) */
function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export default function LiveCameraDetails({ source }: Props) {
  const { src } = useAuthenticatedImage(source?.last_frame_url, source?.last_frame_at);

  const isLive = source?.feed_status === "live";
  const statusLabel = isLive ? "Online" : source ? "Offline" : null;

  return (
    <div className="lm-details-card">
      {/* ── Section title ── */}
      <div className="lm-details-section-hd">Selected Camera</div>

      {!source ? (
        <div className="lm-details-empty">Select a camera to see details</div>
      ) : (
        <>
          {/* ── Camera name + live indicator ── */}
          <div className="lm-details-cam-header">
            <span className="lm-details-cam-name">{source.label}</span>
            <span className={`lm-details-live-pill${isLive ? " lm-details-live-pill--on" : " lm-details-live-pill--off"}`}>
              <span className="lm-details-live-dot" aria-hidden="true" />
              {isLive ? "Live" : "Offline"}
            </span>
          </div>

          {/* ── Frame preview with teal border ── */}
          <div className={`lm-details-preview${isLive ? " lm-details-preview--live" : ""}`}>
            {src ? (
              <img src={src} alt={source.label} />
            ) : (
              <div className="lm-details-preview--empty">
                {source.last_frame_url ? "Frame loading…" : "No frame available"}
              </div>
            )}
          </div>

          {/* ── Camera Details ── */}
          <div className="lm-details-meta">
            <div className="lm-details-sub-hd">Camera Details</div>

            <div className="lm-details-row">
              <span className="lm-details-key">Status</span>
              <span className={`lm-details-val${isLive ? " lm-details-val--online" : ""}`}>
                {statusLabel}
              </span>
            </div>

            {/* MOCK spec rows */}
            <div className="lm-details-row">
              <span className="lm-details-key">Resolution</span>
              <span className="lm-details-val">{MOCK_SPECS.resolution}</span>
            </div>
            <div className="lm-details-row">
              <span className="lm-details-key">Frame Rate</span>
              <span className="lm-details-val">{MOCK_SPECS.frameRate}</span>
            </div>
            <div className="lm-details-row">
              <span className="lm-details-key">Bitrate</span>
              <span className="lm-details-val">{MOCK_SPECS.bitrate}</span>
            </div>
            <div className="lm-details-row">
              <span className="lm-details-key">AI Detection</span>
              <span className="lm-details-val">{MOCK_SPECS.aiDetect}</span>
            </div>
            <div className="lm-details-row">
              <span className="lm-details-key">Uptime</span>
              <span className="lm-details-val lm-details-val--bold">{MOCK_SPECS.uptime}</span>
            </div>

            {/* Last Event — 2-line display */}
            {source.last_frame_at && (
              <div className="lm-details-row lm-details-row--top">
                <span className="lm-details-key">Last Event</span>
                <span className="lm-details-last-event">
                  <span className="lm-details-last-event-label">Vehicle Detected</span>
                  <span className="lm-details-last-event-time">{relativeTime(source.last_frame_at)}</span>
                </span>
              </div>
            )}
          </div>

          {/* ── View Camera Details button ── */}
          <div className="lm-details-footer">
            <button className="lm-details-view-btn" aria-label={`View full details for ${source.label}`}>
              View Camera Details
              <ExternalIcon />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
