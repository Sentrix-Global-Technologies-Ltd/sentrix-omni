import type { Tone } from "../../../components/ui/tone";
import type { FilterOption } from "../../../components/shared/FilterSelect";
import type { RiskBand, RiskTrend } from "../api/road-risk.types";

export { formatDateTime, relativeTime } from "../../../lib/format";

export function roadRiskBandTone(band: RiskBand | null): Tone {
  switch (band) {
    case "low":
      return "success";
    case "moderate":
      return "warning";
    case "high":
      return "error";
    default:
      return "light";
  }
}

export function roadRiskTrendLabel(trend: RiskTrend | null): string {
  switch (trend) {
    case "up":
      return "Rising risk";
    case "down":
      return "Easing";
    default:
      return "Stable";
  }
}

export const ROAD_RISK_BAND_OPTIONS: FilterOption[] = [
  { value: "low", label: "Low risk" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High risk" },
];

export const ROAD_RISK_ACTIVE_OPTIONS: FilterOption[] = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];
