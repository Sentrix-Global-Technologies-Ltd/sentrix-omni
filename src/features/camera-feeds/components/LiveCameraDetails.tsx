import { useNavigate } from "react-router";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { relativeTime } from "./feedStatusTone";
import type { CameraSource } from "../api/camera-feeds.types";

/** Format a raw source type slug into a readable label. */
function formatSourceType(type: string): string {
  const MAP: Record<string, string> = {
    ip_camera:     "IP Camera",
    cctv:          "CCTV",
    rtsp:          "RTSP Stream",
    phone:         "Phone Camera",
    dashcam:       "Dashcam",
    smart_glasses: "Smart Glasses",
    upload:        "Upload",
    external_cctv: "External CCTV",
  };
  return MAP[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Warning" : "Critical";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ display: "inline-block", width: 48, height: 5, borderRadius: 3, background: "#e5e7eb" }}>
        <span style={{ display: "block", width: `${score}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.4s" }} />
      </span>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, color }}>{score}% — {label}</span>
    </span>
  );
}

interface Props {
  source: CameraSource | null;
}

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
  const navigate = useNavigate();
  const { src } = useAuthenticatedImage(source?.last_frame_url, source?.last_frame_at);

  const isLive = source?.feed_status === "live";
  const statusLabel = isLive ? "Online" : source ? "Offline" : null;

  function handleViewDetails() {
    if (source) navigate(`/vision-guard/camera-sources?view=${source.id}`);
  }

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

              <div className="lm-details-row">
              <span className="lm-details-key">Type</span>
              <span className="lm-details-val">{formatSourceType(source.type)}</span>
            </div>

            {source.health_score !== null && (
              <div className="lm-details-row">
                <span className="lm-details-key">Health</span>
                <span className="lm-details-val"><HealthBar score={source.health_score} /></span>
              </div>
            )}

            {(source.site || source.zone) && (
              <div className="lm-details-row">
                <span className="lm-details-key">Location</span>
                <span className="lm-details-val">
                  {[source.site, source.zone].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}

            {source.connection_url && (
              <div className="lm-details-row">
                <span className="lm-details-key">Connection</span>
                <span
                  className="lm-details-val"
                  title={source.connection_url}
                  style={{ maxWidth: "9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
                >
                  {source.connection_url}
                </span>
              </div>
            )}

            <div className="lm-details-row">
              <span className="lm-details-key">Last frame</span>
              <span className="lm-details-val">
                {source.last_frame_at ? relativeTime(source.last_frame_at) : "Never"}
              </span>
            </div>

            {source.tags && source.tags.length > 0 && (
              <div className="lm-details-row lm-details-row--top">
                <span className="lm-details-key">Tags</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {source.tags.map((t) => (
                    <span key={t} style={{ fontSize: "0.6875rem", background: "var(--color-gray-100, #f3f4f6)", borderRadius: 999, padding: "2px 8px", color: "var(--color-gray-600, #4b5563)", fontWeight: 500 }}>{t}</span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* ── View Camera Details button ── */}
          <div className="lm-details-footer">
            <button
              className="lm-details-view-btn"
              aria-label={`View full details for ${source.label}`}
              onClick={handleViewDetails}
            >
              View Camera Details
              <ExternalIcon />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
