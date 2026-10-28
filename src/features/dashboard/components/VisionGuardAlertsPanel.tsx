import { useNavigate } from "react-router";
import { useRecentDetections } from "../../detections/hooks/useDetections";
import { detectionSeverityTone, relativeTime, titleCase } from "../../detections/components/detectionTone";
import { humanize } from "../../../lib/format";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { AlertHexaIcon } from "../../../icons";

function timeAgo(iso: string | null): string {
  return relativeTime(iso);
}

/**
 * VisionGuardAlertsPanel
 * Shows the 4 most-recent DetectionEvents for this organisation, polled every
 * 5 s via useRecentDetections.  Detections that opened an incident are marked
 * with a link so dispatchers can jump straight to the case.
 *
 * Permission: incidents.view (same gate the backend uses for /detections/recent).
 * "View all" navigates to /vision-guard/detections.
 */
export default function VisionGuardAlertsPanel() {
  const navigate = useNavigate();
  const { data: result, isLoading, isError } = useRecentDetections({ limit: 4 });
  const detections = result?.data ?? [];

  return (
    <section className="panel alerts-panel">
      <div className="panel-title">
        <h2>Active Detections</h2>
        <button className="text-link" onClick={() => navigate("/vision-guard/detections")}>
          View all
        </button>
      </div>

      <div className="alerts-list">
        {isLoading && (
          <div style={{ padding: "16px 0", fontSize: 12, color: "#8290a1" }}>Loading…</div>
        )}

        {isError && (
          <div style={{ padding: "16px 0", fontSize: 12, color: "#e53e3e" }}>
            Unable to load detections.
          </div>
        )}

        {!isLoading && !isError && detections.length === 0 && (
          <div style={{ padding: "16px 0", fontSize: 12, color: "#8290a1" }}>
            No recent detections.
          </div>
        )}

        {!isLoading && !isError && detections.map((d) => (
          <div className="alert-row" key={d.id}>
            <div className={`alert-icon ${d.severity === "critical" ? "high" : d.severity}`}>
              <AlertHexaIcon />
            </div>
            <div className="alert-copy">
              <strong>{humanize(d.type)}</strong>
              <span>
                {[d.site, d.zone].filter(Boolean).join(" · ") || "Unknown location"}
                {d.incident_id && (
                  <>
                    {" · "}
                    <button
                      className="text-link"
                      style={{ fontSize: "inherit" }}
                      onClick={() => navigate(`/incidents/${d.incident_id}`)}
                    >
                      View incident
                    </button>
                  </>
                )}
              </span>
            </div>
            <div className="alert-meta">
              <span>{timeAgo(d.received_at)}</span>
              <StatusBadge tone={detectionSeverityTone[d.severity]}>
                {titleCase(d.severity)}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
