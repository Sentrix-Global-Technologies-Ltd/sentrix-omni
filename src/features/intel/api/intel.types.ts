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
