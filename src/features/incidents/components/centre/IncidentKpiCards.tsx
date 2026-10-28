import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: number | null;
  sub?: string;
  accent: "critical" | "warning" | "info" | "success" | "neutral";
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="ic-stat-card">
      <div className="ic-stat-label">{label}</div>
      <div className="ic-stat-value">
        {value === null ? (
          <span className="ic-stat-skeleton" aria-label="Loading…" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      {sub && <div className="ic-stat-sub">{sub}</div>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}

interface IncidentKpiCardsProps {
  total: number | null;
  open: number | null;
  escalated: number | null;
  critical: number | null;
  resolved: number | null;
}

/**
 * Five KPI stat cards at the top of the Incidents Centre.
 * Values come from useIncidentKpis() — null means the query is loading.
 * The 5th card is "Resolved" (not "False Positives" — that status
 * doesn't exist on the backend).
 */
export default function IncidentKpiCards({
  total,
  open,
  escalated,
  critical,
  resolved,
}: IncidentKpiCardsProps): ReactNode {
  return (
    <div className="ic-kpi-grid">
      <KpiCard label="Total Incidents" value={total}    accent="neutral"  />
      <KpiCard label="Open"            value={open}     accent="warning"  sub="Awaiting action" />
      <KpiCard label="Escalated"       value={escalated} accent="critical" sub="Needs attention" />
      <KpiCard label="Critical"        value={critical} accent="critical" sub="High severity" />
      <KpiCard label="Resolved"        value={resolved} accent="success"  sub="All time" />
    </div>
  );
}
