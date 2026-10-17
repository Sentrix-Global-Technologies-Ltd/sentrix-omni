import type { FeedStatus } from "../api/camera-feeds.types";

interface Props {
  /** feed_status from CameraSource */
  feedStatus: FeedStatus;
  /** health_score (0–100), null if no frames ever pushed */
  healthScore: number | null;
}

/** Signal level derived from real feed_status + health_score. */
type SignalLevel = "excellent" | "good" | "fair" | "na";

function signalLevel(feedStatus: FeedStatus, healthScore: number | null): SignalLevel {
  /* MOCK: connection signal is not a real backend field. Derived from
     feed_status + health_score as a proxy until the backend exposes
     a dedicated connection-quality field. */
  if (feedStatus === "live") {
    if (healthScore === null) return "fair";
    if (healthScore >= 90) return "excellent";
    if (healthScore >= 70) return "good";
    return "fair";
  }
  if (feedStatus === "stale") return "fair";
  return "na";
}

const LABEL: Record<SignalLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  na: "N/A",
};

/** Heights of the 4 signal bars for each level (px). */
const BARS: Record<SignalLevel, number[]> = {
  excellent: [4, 7, 10, 13],
  good:      [4, 7, 10, 13],
  fair:      [4, 7, 10, 13],
  na:        [4, 7, 10, 13],
};
/** How many bars are "active" for each level. */
const ACTIVE: Record<SignalLevel, number> = {
  excellent: 4,
  good:      3,
  fair:      2,
  na:        0,
};

/**
 * Renders 4 ascending signal bars + a text label.
 * Signal level is a MOCK derived from feed_status + health_score.
 */
export default function CameraConnectionIndicator({ feedStatus, healthScore }: Props) {
  const level = signalLevel(feedStatus, healthScore);
  const activeCount = ACTIVE[level];
  const isFair = level === "fair";

  return (
    <span className="cs-signal" title={`Connection: ${LABEL[level]} (derived)`}>
      {BARS[level].map((h, i) => {
        const isActive = i < activeCount;
        const barClass = isActive
          ? isFair
            ? "cs-signal-bar cs-signal-bar--fair"
            : "cs-signal-bar cs-signal-bar--active"
          : level === "na"
          ? "cs-signal-bar cs-signal-bar--na"
          : "cs-signal-bar";
        return (
          <span
            key={i}
            className={barClass}
            style={{ height: `${h}px` }}
          />
        );
      })}
      <span className="cs-signal-label">{LABEL[level]}</span>
    </span>
  );
}
