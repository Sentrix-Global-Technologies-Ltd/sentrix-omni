interface Props {
  /** 0–100, or null if the source has never pushed a frame. */
  score: number | null;
}

const R = 12; // circle radius
const C = 2 * Math.PI * R; // circumference ≈ 75.4

function ringColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

/**
 * Small circular progress ring showing the health_score (0–100).
 * Renders "N/A" when the score is null (no frames ever pushed).
 */
export default function CameraHealthRing({ score }: Props) {
  if (score === null) {
    return (
      <span className="cs-ring-wrap">
        <span className="cs-ring-text" style={{ fontSize: 11 }}>N/A</span>
      </span>
    );
  }

  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * C;
  const color = ringColor(pct);

  return (
    <span className="cs-ring-wrap" title={`Health score: ${pct}%`}>
      <span className="cs-ring">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          {/* track */}
          <circle cx="16" cy="16" r={R} stroke="#e5e7eb" strokeWidth="3" fill="none" />
          {/* arc */}
          <circle
            cx="16"
            cy="16"
            r={R}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="cs-ring-pct">{pct}</span>
      </span>
    </span>
  );
}
