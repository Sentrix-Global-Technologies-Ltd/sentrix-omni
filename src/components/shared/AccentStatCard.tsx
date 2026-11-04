import type { ReactNode } from "react";
import "../../features/incidents/styles/incidents-centre.css";
import { valueSizeClass } from "./fitText";

export type StatAccent = "critical" | "warning" | "info" | "success" | "neutral";

interface AccentStatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent: StatAccent;
  loading?: boolean;
}

/**
 * The Incidents Centre KPI card (uppercase label, big value, muted sub line,
 * coloured accent bar along the bottom) as a reusable component, with the
 * value auto-sized so long amounts never spill out of the card.
 */
export default function AccentStatCard({ label, value, sub, accent, loading }: AccentStatCardProps): ReactNode {
  const text = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <div className="ic-stat-card ic-stat-card--fit">
      <div className="ic-stat-label">{label}</div>
      {loading ? (
        <div className="ic-stat-skeleton" aria-label="Loading…" />
      ) : (
        <div className={valueSizeClass(text)} title={text}>
          {text}
        </div>
      )}
      {sub && <div className="ic-stat-sub">{sub}</div>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}
