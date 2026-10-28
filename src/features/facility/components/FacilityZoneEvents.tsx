import { useNavigate } from "react-router";
import type { RecentZoneEvent, FacilityBuilding } from "../api/facility.types";

// ── Severity → icon kind mapping ─────────────────────────────────────────────

type IconKind = "alert-high" | "alert-medium" | "alert-low" | "info" | "check";

function severityToIconKind(severity: RecentZoneEvent["severity"]): IconKind {
  switch (severity) {
    case "critical":
    case "high":     return "alert-high";
    case "medium":   return "alert-medium";
    case "low":      return "alert-low";
    case "info":     return "info";
    default:         return "info";
  }
}

// ── Event icon ───────────────────────────────────────────────────────────────

function EventIcon({ kind }: { kind: IconKind }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "alert-high":
    case "alert-medium":
      return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5}/></svg>;
    case "info":
    case "alert-low":
      return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5}/></svg>;
    case "check":
      return <svg {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  }
}

function iconClass(kind: IconKind): string {
  switch (kind) {
    case "alert-high":   return "fm-event-icon--high";
    case "alert-medium": return "fm-event-icon--medium";
    case "alert-low":
    case "info":         return "fm-event-icon--low";
    case "check":        return "fm-event-icon--check";
  }
}

// ── Relative time formatting ──────────────────────────────────────────────────

function formatRelativeTime(receivedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(receivedAt).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  events: RecentZoneEvent[];
  buildings: FacilityBuilding[];
  onSelectBuilding: (id: string) => void;
}

export default function FacilityZoneEvents({ events, buildings, onSelectBuilding }: Props) {
  const navigate = useNavigate();
  return (
    <div className="fm-panel">
      <div className="fm-events-hd">
        <span className="fm-events-title">Recent Zone Events</span>
        <button className="fm-view-all" onClick={() => navigate("/vision-guard/detections")}>View all</button>
      </div>

      <div className="fm-event-list">
        {events.length === 0 ? (
          <div style={{ padding: "1rem 0.875rem", fontSize: "0.8125rem", color: "#94a3b8", textAlign: "center" }}>
            No recent events.
          </div>
        ) : (
          events.map((evt) => {
            const kind = severityToIconKind(evt.severity);
            // Resolve building ID from evt.site name
            const buildingId = evt.site
              ? buildings.find((b) => b.name === evt.site)?.id ?? null
              : null;

            const location = [evt.site, evt.zone].filter(Boolean).join(" · ") || "Unknown location";

            return (
              <div
                key={evt.id}
                className="fm-event-item"
                onClick={() => buildingId && onSelectBuilding(buildingId)}
                style={{ cursor: buildingId ? "pointer" : "default" }}
              >
                <div className={`fm-event-icon ${iconClass(kind)}`}>
                  <EventIcon kind={kind} />
                </div>
                <div className="fm-event-body">
                  <div className="fm-event-title">{evt.summary ?? `${evt.type ?? "Event"}`}</div>
                  <div className="fm-event-location">{location}</div>
                </div>
                <div className="fm-event-right">
                  <span className={`fm-severity-badge fm-severity--${evt.severity}`}>{evt.severity}</span>
                  <span className="fm-event-time">{formatRelativeTime(evt.received_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
