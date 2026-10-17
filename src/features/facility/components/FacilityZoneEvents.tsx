import { MOCK_ZONE_EVENTS } from "../data/facilityMockData";
import type { MockZoneEvent } from "../data/facilityMockData";

// ── Event icon ───────────────────────────────────────────────────────────────

function EventIcon({ kind }: { kind: MockZoneEvent["iconKind"] }) {
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

function iconClass(kind: MockZoneEvent["iconKind"]): string {
  switch (kind) {
    case "alert-high": return "fm-event-icon--high";
    case "alert-medium": return "fm-event-icon--medium";
    case "alert-low":
    case "info": return "fm-event-icon--low";
    case "check": return "fm-event-icon--check";
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onSelectBuilding: (id: string) => void;
}

export default function FacilityZoneEvents({ onSelectBuilding }: Props) {
  return (
    <div className="fm-panel">
      <div className="fm-events-hd">
        <span className="fm-events-title">Recent Zone Events</span>
        <button className="fm-view-all">View all</button>
      </div>

      <div className="fm-event-list">
        {MOCK_ZONE_EVENTS.map((evt) => (
          <div
            key={evt.id}
            className="fm-event-item"
            onClick={() => evt.buildingId && onSelectBuilding(evt.buildingId)}
          >
            <div className={`fm-event-icon ${iconClass(evt.iconKind)}`}>
              <EventIcon kind={evt.iconKind} />
            </div>
            <div className="fm-event-body">
              <div className="fm-event-title">{evt.title}</div>
              <div className="fm-event-location">{evt.location}</div>
            </div>
            <div className="fm-event-right">
              <span className={`fm-severity-badge fm-severity--${evt.severity}`}>{evt.severity}</span>
              <span className="fm-event-time">{evt.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
