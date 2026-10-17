/**
 * LiveAiTimeline — horizontal time-axis AI detection timeline
 * MOCK / SIMULATED data only — no real AI events
 */

import { useState } from "react";

/* ── MOCK event slots ───────────────────────────────────────────────────── */
type EventType = "vehicle" | "person" | "activity" | "security";

interface TimeSlot {
  id: string;
  time: string;
  type: EventType;
  count: number;
  isLive: boolean;
}

// MOCK — simulated detection events for UI demonstration only
const MOCK_SLOTS: TimeSlot[] = [
  { id: "t1", time: "10:30 AM",    type: "security",  count: 3,  isLive: false },
  { id: "t2", time: "10:35 AM",    type: "activity",  count: 7,  isLive: false },
  { id: "t3", time: "10:40 AM",    type: "vehicle",   count: 12, isLive: false },
  { id: "t4", time: "10:45:23 AM", type: "person",    count: 5,  isLive: true  },
  { id: "t5", time: "10:50 AM",    type: "activity",  count: 4,  isLive: false },
  { id: "t6", time: "10:55 AM",    type: "vehicle",   count: 8,  isLive: false },
  { id: "t7", time: "11:00 AM",    type: "security",  count: 2,  isLive: false },
];

const FILTER_OPTIONS = [
  { value: "all",      label: "All Events"  },
  { value: "vehicle",  label: "Vehicle"     },
  { value: "person",   label: "Person"      },
  { value: "activity", label: "Activity"    },
  { value: "security", label: "Security"    },
];

/* ── Inline SVG icons (no lucide-react) ─────────────────────────────────── */
function VehicleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="11" width="22" height="8" rx="2" ry="2"/>
      <path d="M16 19v2M8 19v2M1 11l4-6h14l4 6"/>
      <circle cx="7.5" cy="19" r="1.5"/>
      <circle cx="16.5" cy="19" r="1.5"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="3"/>
      <path d="M12 8v8M9 11h6M9 19l-1 2M15 19l1 2"/>
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13" cy="4" r="2"/>
      <path d="M7 14l2-4 2 2 3-5 2 3"/>
      <path d="M5 20l4-4h5l3-4"/>
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function BubbleIcon({ type }: { type: EventType }) {
  switch (type) {
    case "vehicle":  return <VehicleIcon />;
    case "person":   return <PersonIcon />;
    case "activity": return <ActivityIcon />;
    case "security": return <SecurityIcon />;
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function LiveAiTimeline() {
  const [filter, setFilter] = useState<string>("all");

  const visible = filter === "all"
    ? MOCK_SLOTS
    : MOCK_SLOTS.map((s) => ({ ...s, count: s.type === filter ? s.count : 0 }));

  return (
    <div className="lm-htl-card">
      {/* ── Header ── */}
      <div className="lm-htl-header">
        <span className="lm-htl-title">AI Detection Timeline</span>

        {/* Live Feed badge with pulsing dot */}
        <span className="lm-htl-live-badge" aria-label="Live feed active">
          <span className="lm-htl-live-dot" aria-hidden="true" />
          Live Feed
        </span>

        {/* SIMULATED notice */}
        <span
          style={{
            marginLeft: "0.25rem",
            display: "inline-flex",
            alignItems: "center",
            padding: "0.125rem 0.4375rem",
            borderRadius: "9999px",
            fontSize: "0.5625rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            background: "rgba(245,158,11,0.1)",
            color: "#b45309",
            border: "1px solid rgba(245,158,11,0.28)",
          }}
          title="This timeline displays simulated data for demonstration purposes"
        >
          SIMULATED
        </span>

        {/* All Events filter */}
        <select
          className="lm-htl-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter detection events"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Scrollable time-axis track ── */}
      <div className="lm-htl-scroll" role="region" aria-label="AI detection timeline">
        <div className="lm-htl-track">
          {visible.map((slot) => (
            <div
              key={slot.id}
              className={`lm-htl-slot${slot.isLive ? " lm-htl-slot--live" : ""}`}
              aria-label={`${slot.time}: ${slot.count} ${slot.type} detection${slot.count !== 1 ? "s" : ""}${slot.isLive ? " (live)" : ""}`}
            >
              {/* Time label — above the axis zone */}
              <span className="lm-htl-time-label">{slot.time}</span>

              {/* Axis row — fixed height zone; LIVE pip is absolutely positioned inside */}
              <div className="lm-htl-axis-row" aria-hidden="true">
                {/* LIVE pill: floats above the axis line via absolute positioning in CSS */}
                {slot.isLive && (
                  <span className="lm-htl-live-pip">
                    <span aria-hidden="true">●</span>&nbsp;LIVE
                  </span>
                )}
                {/* Axis line with ruler tick (::before) and live dot (::after on live slot) */}
                <div className="lm-htl-axis-tick" />
              </div>

              {/* Event bubble + count — inline row below axis */}
              <div className="lm-htl-slot-body">
                <div className={`lm-htl-bubble lm-htl-bubble--${slot.type}`} aria-hidden="true">
                  <BubbleIcon type={slot.type} />
                </div>
                <div className="lm-htl-count">{slot.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="lm-htl-legend" aria-label="Legend">
        <span className="lm-htl-legend-item">
          <span className="lm-htl-legend-dot lm-htl-legend-dot--vehicle" aria-hidden="true" />
          Vehicle Detected
        </span>
        <span className="lm-htl-legend-item">
          <span className="lm-htl-legend-dot lm-htl-legend-dot--person" aria-hidden="true" />
          Person Detected
        </span>
        <span className="lm-htl-legend-item">
          <span className="lm-htl-legend-dot lm-htl-legend-dot--activity" aria-hidden="true" />
          Unusual Activity
        </span>
        <span className="lm-htl-legend-item">
          <span className="lm-htl-legend-dot lm-htl-legend-dot--security" aria-hidden="true" />
          Security Alert
        </span>
        <span className="lm-htl-legend-item">
          <span className="lm-htl-legend-dash" aria-hidden="true" />
          AI Confidence Score
        </span>
      </div>
    </div>
  );
}
