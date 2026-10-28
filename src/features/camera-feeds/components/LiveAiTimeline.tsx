/**
 * LiveAiTimeline — horizontal AI detection timeline.
 *
 * Data source: GET /api/v1/organizations/{org}/detections/recent
 *              (useRecentDetections, polling every 30 s — no push stream exists)
 * Camera scope: optional cameraSourceId prop restricts to one camera.
 *
 * Timeline window: 7 × 5-minute buckets ending at the current 5-minute boundary.
 * Data coverage: up to 50 most-recent detections per query (backend MAX_LIMIT).
 * Bucket counts reflect only events within those 50 records; they do not
 * represent a complete count of all detections that occurred in that window.
 */

import { useState, useMemo } from "react";
import { useRecentDetections } from "../hooks/useRecentDetections";
import { classifyDetection } from "./detectionClassifier";
import type { DetectionCategory } from "./detectionClassifier";
import type { DetectionEvent } from "../api/detections.types";

/* ── Constants ────────────────────────────────────────────────────────────── */
/** Number of 5-minute slots shown in the timeline. */
export const SLOT_COUNT = 7;
/** Duration of each slot in milliseconds. */
export const SLOT_MS = 5 * 60 * 1000;
/** Backend MAX_LIMIT — passed as `limit` to keep records consistent with promise. */
const REQUEST_LIMIT = 50;

/* ── Bucketing helpers (exported for unit tests) ─────────────────────────── */
export interface TimeSlot {
  id: string;
  startMs: number;
  timeLabel: string;
  /** Dominant category for the bubble icon — based on unfiltered events. */
  dominantType: DetectionCategory;
  /** Total events in this slot, regardless of category filter. */
  allCount: number;
  /** Per-category counts for the filter dropdown. */
  counts: Record<DetectionCategory, number>;
  /** True for the slot that contains `nowMs`. */
  isLive: boolean;
}

/** Zero-initialised per-category count record. */
function zeroCounts(): Record<DetectionCategory, number> {
  return { vehicle: 0, person: 0, activity: 0, security: 0 };
}

/**
 * Returns the dominant DetectionCategory by count.
 * Tie-breaks in priority order: security > vehicle > person > activity.
 * Returns "activity" when counts are all zero.
 */
export function dominantCategory(counts: Record<DetectionCategory, number>): DetectionCategory {
  const priority: DetectionCategory[] = ["security", "vehicle", "person", "activity"];
  return priority.reduce<DetectionCategory>(
    (best, cat) => (counts[cat] > counts[best] ? cat : best),
    "activity",
  );
}

/**
 * Format a UTC epoch ms as a local-time slot label.
 * Example: 1_718_000_000_000 → "10:30 AM"
 */
export function formatSlotTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Build SLOT_COUNT five-minute slots ending at (or containing) `nowMs`.
 * Events are bucketed by `received_at`; records with null or invalid
 * timestamps are skipped.
 */
export function buildTimeSlots(events: DetectionEvent[], nowMs: number): TimeSlot[] {
  // Snap to the START of the current 5-minute bucket
  const currentBucketStart = Math.floor(nowMs / SLOT_MS) * SLOT_MS;

  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const slotStart = currentBucketStart - (SLOT_COUNT - 1 - i) * SLOT_MS;
    const slotEnd = slotStart + SLOT_MS;
    const isLive = i === SLOT_COUNT - 1;

    const slotEvents = events.filter((e) => {
      if (!e.received_at) return false;
      const t = new Date(e.received_at).getTime();
      return !Number.isNaN(t) && t >= slotStart && t < slotEnd;
    });

    const counts = zeroCounts();
    for (const e of slotEvents) {
      counts[classifyDetection(e.type)]++;
    }

    return {
      id: `slot-${slotStart}`,
      startMs: slotStart,
      timeLabel: formatSlotTime(slotStart),
      dominantType: dominantCategory(counts),
      allCount: slotEvents.length,
      counts,
      isLive,
    };
  });
}

/** Count to display for a slot given the current filter. */
function filteredCount(slot: TimeSlot, filter: string): number {
  if (filter === "all") return slot.allCount;
  return slot.counts[filter as DetectionCategory] ?? 0;
}

/* ── Filter options ───────────────────────────────────────────────────────── */
const FILTER_OPTIONS = [
  { value: "all",      label: "All Events" },
  { value: "vehicle",  label: "Vehicle"    },
  { value: "person",   label: "Person"     },
  { value: "activity", label: "Activity"   },
  { value: "security", label: "Security"   },
];

/* ── Inline SVG icons (no lucide-react) ──────────────────────────────────── */
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

function BubbleIcon({ type }: { type: DetectionCategory }) {
  switch (type) {
    case "vehicle":  return <VehicleIcon />;
    case "person":   return <PersonIcon />;
    case "activity": return <ActivityIcon />;
    case "security": return <SecurityIcon />;
  }
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface Props {
  /** When set, restricts detections to this camera source. */
  cameraSourceId?: string | null;
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function LiveAiTimeline({ cameraSourceId }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading, isError, refetch } = useRecentDetections({
    limit: REQUEST_LIMIT,
    cameraSourceId,
  });

  // Build slots from the resolved data; Date.now() is captured inside useMemo
  // so it reflects the time when data last arrived, not each render.
  const slots = useMemo(() => {
    const events = data?.data ?? [];
    return buildTimeSlots(events, Date.now());
  }, [data]);

  const hasData = !isLoading && !isError && data != null;
  const allEmpty = hasData && slots.every((s) => s.allCount === 0);

  return (
    <div className="lm-htl-card">
      {/* ── Header ── */}
      <div className="lm-htl-header">
        <span className="lm-htl-title">AI Detection Timeline</span>

        {/* NOTE: "Live Feed" badge removed — the endpoint is polled every 30 s,
            not pushed in realtime. No badge is shown to avoid implying a stream. */}

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

      {/* ── Loading state ── */}
      {isLoading && !data && (
        <div className="lm-loading" role="status" aria-label="Loading detection timeline">
          Loading…
        </div>
      )}

      {/* ── Error state — never fall back to mock data ── */}
      {isError && !data && (
        <div className="lm-error-box" role="alert">
          <span>Failed to load detections</span>
          <button className="lm-retry-btn" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* ── Scrollable timeline track — always rendered when data is available ── */}
      {hasData && (
        <div className="lm-htl-scroll" role="region" aria-label="AI detection timeline">
          <div className="lm-htl-track">
            {slots.map((slot) => {
              const count = filteredCount(slot, filter);
              return (
                <div
                  key={slot.id}
                  className={`lm-htl-slot${slot.isLive ? " lm-htl-slot--live" : ""}${count === 0 ? " lm-htl-slot--empty" : ""}`}
                  aria-label={`${slot.timeLabel}: ${count} ${filter === "all" ? "" : filter + " "}detection${count !== 1 ? "s" : ""}${slot.isLive ? " (current)" : ""}`}
                >
                  <span className="lm-htl-time-label">{slot.timeLabel}</span>

                  <div className="lm-htl-axis-row" aria-hidden="true">
                    {slot.isLive && (
                      <span className="lm-htl-live-pip">
                        <span aria-hidden="true">●</span>&nbsp;LIVE
                      </span>
                    )}
                    <div className="lm-htl-axis-tick" />
                  </div>

                  <div className="lm-htl-slot-body">
                    <div
                      className={`lm-htl-bubble lm-htl-bubble--${count > 0 ? slot.dominantType : "empty"}`}
                      aria-hidden="true"
                    >
                      {count > 0 ? <BubbleIcon type={slot.dominantType} /> : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      )}
                    </div>
                    <div className="lm-htl-count" style={count === 0 ? { opacity: 0.35 } : undefined}>
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quiet-period notice inside the track, visible only when all buckets are empty */}
          {allEmpty && (
            <p style={{ margin: "0.25rem 0 0.5rem", textAlign: "center", fontSize: "0.6875rem", color: "var(--color-gray-400, #9ca3af)" }}>
              No detections in the past {SLOT_COUNT * 5} minutes
              {cameraSourceId ? " for this camera" : ""}
            </p>
          )}
        </div>
      )}

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

      {/* ── Data-coverage note ── */}
      {hasData && (
        <div
          style={{
            padding: "0.25rem 0.75rem 0.5rem",
            fontSize: "0.625rem",
            color: "var(--color-gray-400, #9ca3af)",
            letterSpacing: "0.02em",
          }}
          aria-label="Data coverage note"
        >
          Up to {REQUEST_LIMIT} most-recent detections · polls every 30 s
          {cameraSourceId ? " · this camera" : " · all cameras"}
        </div>
      )}
    </div>
  );
}
