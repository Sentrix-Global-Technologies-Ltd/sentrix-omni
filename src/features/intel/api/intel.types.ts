/** Intel types — mirror the backend IntelService report/analytics arrays. */

export type IntelRange = "24h" | "7d" | "30d";

export interface DurationSummary {
  measured: number;
  average: number | null;
  median: number | null;
}

export interface TrendPoint {
  bucket: string;
  count: number;
}

export interface IntelReport {
  range: { since: string; until: string };
  incidents: {
    total: number;
    by_severity: Record<string, number>;
    by_status: Record<string, number>;
  };
  emergencies: { total: number; by_status: Record<string, number> };
  trips: { total: number };
  observations: { total: number };
  response_time_seconds: {
    methodology: string;
    incident_dispatch: DurationSummary;
    emergency_acknowledge: DurationSummary;
    combined: DurationSummary;
  };
  top_zones: Array<{ camera_source_id: string | null; count: number }>;
}

export interface IntelAnalytics {
  range: { since: string; until: string; bucket: string };
  trends: { incidents: TrendPoint[]; emergencies: TrendPoint[] };
  breakdowns: {
    incidents_by_severity: Record<string, number>;
    emergencies_by_severity: Record<string, number>;
    observations_by_kind: Record<string, number>;
  };
  heatmap: Array<{ cell: string; lat: number; lng: number; count: number }>;
}

/** `GET intel/dispatch-trend` — Command Center avg time-to-dispatch KPI:
 * rolling 24h window vs. the prior 24h window. */
export interface IntelDispatchTrend {
  methodology: string;
  current: DurationSummary & { since: string; until: string };
  previous: DurationSummary & { since: string; until: string };
}

/** A contributing detection type behind the current Threat Score, with its
 * % change vs. the prior equal-length window (null = no prior occurrences,
 * a % change from zero is undefined rather than "infinite"). */
export interface ThreatFactor {
  type: string;
  count: number;
  change_pct: number | null;
}

/** `GET intel/threat-score` — see backend ThreatScoreService: a deterministic
 * roll-up of detection_events.risk_score (itself produced by DecisionEngine
 * from Sentrix Core's vision analysis) plus open incidents/emergencies. Not a
 * separate model — this mirrors the real computed number 1:1. */
export interface ThreatScore {
  score: number;
  avg_risk_score: number;
  open_incidents_count: number;
  active_emergencies_count: number;
  factors: ThreatFactor[];
}

/** One persisted `GET intel/threat-score/history` point (hourly snapshots). */
export interface ThreatScoreSnapshot {
  score: number;
  avg_risk_score: number;
  open_incidents_count: number;
  active_emergencies_count: number;
  computed_at: string;
}
