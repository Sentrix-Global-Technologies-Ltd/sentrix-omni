/**
 * Quick Incidents — right-rail incident list.
 * ⚠ SIMULATED DATA — static mock incidents for visual completeness only.
 */

type Severity = "High" | "Medium" | "Low";
type IconTone = "red" | "amber" | "blue";

// MOCK — simulated incidents matching the reference UI design
const MOCK_INCIDENTS: {
  id: string;
  tone: IconTone;
  title: string;
  location: string;
  severity: Severity;
  time: string;
}[] = [
  { id: "m1", tone: "red",   title: "Perimeter Breach",     location: "North Gate - Building A", severity: "High",   time: "2 min ago"  },
  { id: "m2", tone: "amber", title: "Loitering Detected",   location: "Parking Lot A",           severity: "Medium", time: "5 min ago"  },
  { id: "m3", tone: "amber", title: "Unauthorized Access",  location: "East Entrance",           severity: "Medium", time: "8 min ago"  },
  { id: "m4", tone: "blue",  title: "Vehicle Without Auth", location: "Loading Dock",            severity: "Low",    time: "15 min ago" },
];

/* ── Icons ────────────────────────────────────────────────────────────────── */
function PerimeterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 010 8h-1"/>
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}
function LoiteringIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5"/>
      <path d="M9 12l-2 5M15 12l2 5M9 12h6M11 12v5"/>
    </svg>
  );
}
function AccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  );
}
function VehicleAuthIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 20v-1a6 6 0 0112 0v1"/>
      <line x1="12" y1="14" x2="12" y2="17"/>
    </svg>
  );
}

function IncidentIcon({ id, tone }: { id: string; tone: IconTone }) {
  const cls = `lm-incident-icon lm-incident-icon--${tone}`;
  const icons: Record<string, JSX.Element> = {
    m1: <PerimeterIcon />,
    m2: <LoiteringIcon />,
    m3: <AccessIcon />,
    m4: <VehicleAuthIcon />,
  };
  return <span className={cls}>{icons[id]}</span>;
}

const SEVERITY_CLS: Record<Severity, string> = {
  High:   "lm-severity--high",
  Medium: "lm-severity--medium",
  Low:    "lm-severity--low",
};

export default function LiveQuickIncidents() {
  return (
    <div className="lm-incidents-card">
      <div className="lm-card-header">
        <span className="lm-card-title">Quick Incidents</span>
        {/* View all — non-functional placeholder matching the reference */}
        <button className="lm-view-all-btn" aria-label="View all incidents">
          View all
        </button>
      </div>

      {MOCK_INCIDENTS.map((inc) => (
        <div key={inc.id} className="lm-incident-item">
          <IncidentIcon id={inc.id} tone={inc.tone} />

          {/* Title + location */}
          <div className="lm-incident-body">
            <div className="lm-incident-title">{inc.title}</div>
            <div className="lm-incident-sub">{inc.location}</div>
          </div>

          {/* Severity + time — right column */}
          <div className="lm-incident-right">
            <span className={`lm-severity ${SEVERITY_CLS[inc.severity]}`}>
              {inc.severity}
            </span>
            <span className="lm-incident-time">{inc.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
