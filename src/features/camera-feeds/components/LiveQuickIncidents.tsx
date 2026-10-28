/**
 * Quick Incidents — right-rail incident list, wired to real incident data.
 *
 * Data source : GET /organizations/{org}/incidents?status=open&per_page=4
 * Realtime    : useIncidentsRealtime() → invalidates on any incident event
 * Location    : IncidentResource has no text location field (lat/lng only) → always "—"
 */
import { useNavigate } from "react-router";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useIncidentsRealtime } from "../../incidents/hooks/useIncidentsRealtime";
import { relativeTime } from "../../../lib/format";
import type {
  Incident,
  IncidentCentreFilters,
  IncidentSeverity,
} from "../../incidents/api/incidents.types";

/* ── Severity → visual mapping ───────────────────────────────────────────── */

/** Icon background/colour tone per severity level.
 *  critical uses violet to stand visually apart from high (both urgent, but
 *  critical must be unmistakably distinct at a glance). */
const ICON_TONE: Record<IncidentSeverity, string> = {
  critical: "violet",
  high:     "red",
  medium:   "amber",
  low:      "blue",
};

/** Severity text colour class — lm-severity--critical added to live-monitoring.css. */
const SEVERITY_CLS: Record<IncidentSeverity, string> = {
  critical: "lm-severity--critical",
  high:     "lm-severity--high",
  medium:   "lm-severity--medium",
  low:      "lm-severity--low",
};

/* ── Generic alert icon — one shape, tone varies by severity ─────────────── */
function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ── Single incident row ─────────────────────────────────────────────────── */
function IncidentRow({ incident }: { incident: Incident }) {
  const tone = ICON_TONE[incident.severity] ?? "blue";
  const severityCls = SEVERITY_CLS[incident.severity] ?? "lm-severity--low";
  const severityLabel =
    incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1);

  return (
    <div className="lm-incident-item">
      <span className={`lm-incident-icon lm-incident-icon--${tone}`}>
        <AlertIcon />
      </span>

      {/* Title + location (IncidentResource has no text location → always "—") */}
      <div className="lm-incident-body">
        <div className="lm-incident-title">{incident.title}</div>
        <div className="lm-incident-sub">—</div>
      </div>

      {/* Severity badge + relative timestamp */}
      <div className="lm-incident-right">
        <span className={`lm-severity ${severityCls}`}>{severityLabel}</span>
        <span className="lm-incident-time">{relativeTime(incident.opened_at)}</span>
      </div>
    </div>
  );
}

/* ── Stable filter object — defined outside the component to avoid re-renders */
const QUICK_FILTERS: IncidentCentreFilters = { status: "open", per_page: 4 };

/* ── Component ───────────────────────────────────────────────────────────── */
export default function LiveQuickIncidents() {
  const navigate = useNavigate();

  // useIncidents accepts IncidentFilters; IncidentCentreFilters is a structural
  // subtype so this assignment is type-safe.
  const { data, isLoading, isError, refetch } = useIncidents(QUICK_FILTERS);

  // Subscribe to realtime incident events — invalidates the list query on any change.
  useIncidentsRealtime();

  const incidents = data?.data;

  return (
    <div className="lm-incidents-card">
      <div className="lm-card-header">
        <span className="lm-card-title">Quick Incidents</span>
        <button
          className="lm-view-all-btn"
          aria-label="View all incidents"
          onClick={() => navigate("/incidents")}
        >
          View all
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="lm-loading" role="status" aria-label="Loading incidents">
          Loading…
        </div>
      )}

      {/* Error — never silently fall back to fabricated data */}
      {isError && !isLoading && (
        <div className="lm-error-box" role="alert">
          <span>Failed to load incidents</span>
          <button className="lm-retry-btn" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Data resolved */}
      {!isLoading && !isError && incidents != null && (
        incidents.length === 0 ? (
          <div className="lm-loading">No open incidents</div>
        ) : (
          incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))
        )
      )}
    </div>
  );
}
