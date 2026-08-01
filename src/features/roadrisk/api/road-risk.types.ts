export type RiskBand = "low" | "moderate" | "high";

export type RiskTrend = "up" | "down" | "flat";

export interface RoadSegment {
  id: string;
  name: string;
  area: string | null;
  location: { lat: number; lng: number };
  radius_m: number;
  active: boolean;
  distance_m?: number;
  score: number | null;
  band: RiskBand | null;
  band_label: string | null;
  trend: RiskTrend | null;
  factors: string[];
  signal_count: number;
  computed_at: string | null;
  created_at: string;
  updated_at: string;
}
