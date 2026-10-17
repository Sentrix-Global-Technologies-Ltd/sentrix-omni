import { FileIcon, LockIcon, TimeIcon } from "../../../icons";
import { relativeTime, titleCase } from "./evidenceTone";
import type { Observation } from "../api/evidence.types";
import "../styles/evidence-console.css";

function severityClass(severity: string | null): string {
  switch (severity) {
    case "critical": return "ev-severity critical";
    case "high": return "ev-severity high";
    case "medium": return "ev-severity medium";
    case "low": return "ev-severity low";
    default: return "ev-severity info";
  }
}

interface Props {
  observation: Observation;
  selected?: boolean;
  onClick?: () => void;
}

export default function ObservationListRow({ observation: o, selected, onClick }: Props) {
  const label = o.label ?? titleCase(o.kind);
  const sub = o.plate
    ? `Plate: ${o.plate}`
    : o.camera_source_id
    ? `Camera ${o.camera_source_id.slice(0, 8)}`
    : "—";

  return (
    <div
      className={`ev-list-row${selected ? " selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      aria-pressed={selected}
    >
      {/* Thumbnail */}
      <div className="ev-list-thumb">
        {o.snapshot_url ? (
          <img src={o.snapshot_url} alt={label} loading="lazy" />
        ) : (
          <FileIcon className="size-4 opacity-40" />
        )}
      </div>

      {/* Name */}
      <div className="ev-list-name">
        <strong>{label}</strong>
        <small>{sub}</small>
      </div>

      {/* Kind */}
      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
        {titleCase(o.kind)}
      </span>

      {/* Severity */}
      <div className="ev-list-col-severity">
        {o.severity ? (
          <span className={severityClass(o.severity)}>{o.severity}</span>
        ) : (
          <span className="text-gray-300 dark:text-gray-700">—</span>
        )}
      </div>

      {/* Time */}
      <span className="ev-card-time">
        <TimeIcon className="size-3 opacity-60" />
        {o.observed_at ? relativeTime(o.observed_at) : "—"}
      </span>

      {/* Flags */}
      <div className="flex items-center gap-2">
        {o.hold && (
          <span className="ev-flag hold" title="Legal hold">
            <LockIcon className="size-3" />
          </span>
        )}
        {o.bookmarked && (
          <span className="ev-flag bookmarked" title="Bookmarked">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
        )}
        {o.sealed && (
          <span className="text-[9px] font-semibold text-purple-500 dark:text-purple-400">
            SEALED
          </span>
        )}
      </div>
    </div>
  );
}
