import { FileIcon } from "../../../icons";
import { relativeTime, titleCase } from "./evidenceTone";
import type { Observation } from "../api/evidence.types";
import "../styles/evidence-console.css";

/** Derive display media type from observation fields */
function mediaType(o: Observation): "video" | "snapshot" | "audio" | "export" {
  const mt = (o.attributes as Record<string, unknown>)?.media_type as string | undefined;
  if (mt === "video") return "video";
  if (mt === "audio") return "audio";
  if (mt === "export") return "export";
  if (mt === "snapshot") return "snapshot";
  // Fallback: if clip_url exists assume video
  if (o.clip_url) return "video";
  return "snapshot";
}

function typeLabel(mt: ReturnType<typeof mediaType>): string {
  switch (mt) {
    case "video": return "VIDEO";
    case "audio": return "AUDIO";
    case "export": return "EXPORT";
    default: return "SNAPSHOT";
  }
}

interface Props {
  observation: Observation;
  selected?: boolean;
  onClick?: () => void;
}

export default function ObservationCard({ observation: o, selected, onClick }: Props) {
  const label = o.label ?? titleCase(o.kind);
  const attr = o.attributes as Record<string, unknown> ?? {};
  const mt = mediaType(o);
  const duration = attr.duration as string | undefined;
  const locationName = attr.location_name as string | undefined;
  const cameraName = attr.camera_name as string | undefined;
  const incidentId = attr.incident_id as string | undefined;
  const retentionDays = attr.retention_days as number | undefined;

  const sub = locationName && cameraName
    ? `${locationName} • ${cameraName}`
    : o.plate
    ? `Plate: ${o.plate}`
    : o.camera_source_id
    ? `Camera ${o.camera_source_id.slice(0, 8)}`
    : "—";

  // Retention line: warn if < 14 days
  const retLow = retentionDays != null && retentionDays < 14;
  const retLabel = retentionDays != null
    ? `${retentionDays} days remaining`
    : titleCase(o.retention_tier);

  return (
    <article
      className={`ev-card${selected ? " selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      aria-pressed={selected}
    >
      {/* ── Media thumbnail ───────────────────────────────────────────── */}
      <div className="ev-card-media">
        {o.snapshot_url && o.snapshot_url !== "#demo" ? (
          <>
            <img src={o.snapshot_url} alt={label} loading="lazy" />
            <div className="ev-card-shade" />
          </>
        ) : (
          <div className="ev-card-placeholder">
            <FileIcon className="size-8 opacity-40" />
          </div>
        )}

        {/* Top bar: checkbox + type label + ⋮ */}
        <div className="ev-card-top-bar">
          <div className="ev-card-top-left">
            <span className="ev-card-checkbox" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select ${label}`} tabIndex={-1} />
            </span>
            <span className="ev-card-type-label">{typeLabel(mt)}</span>
          </div>
          <button
            className="ev-card-more-btn"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>

        {/* Duration badge (videos only) */}
        {mt === "video" && duration && (
          <span className="ev-card-duration">{duration}</span>
        )}
      </div>

      {/* ── Card content ──────────────────────────────────────────────── */}
      <div className="ev-card-content">
        <div className="ev-card-title">{label}</div>
        <div className="ev-card-sub">{sub}</div>

        {incidentId && (
          <span className="ev-incident-badge">{incidentId}</span>
        )}

        <div className="ev-card-time">
          {/* Clock icon inline */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {o.observed_at ? relativeTime(o.observed_at) : "—"}
        </div>

        <div className={`ev-retention-line${retLow ? " warn" : ""}`}>
          {retLow ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {retLabel}
        </div>
      </div>
    </article>
  );
}
