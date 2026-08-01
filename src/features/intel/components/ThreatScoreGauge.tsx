import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { Tone } from "../../../components/ui/tone";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Score bands mirror the backend's own [0,100] clamp — Nominal/Elevated/
 * Critical are presentation-only labels over the one real computed number
 * (ThreatScoreService), not a second scoring system. */
function band(score: number): { label: string; tone: Tone; color: string } {
  if (score >= 70) return { label: "Critical", tone: "error", color: "#f04438" };
  if (score >= 35) return { label: "Elevated", tone: "warning", color: "#f79009" };
  return { label: "Nominal", tone: "success", color: "#12b76a" };
}

/** Headline Threat Score gauge for the AI Analytics page. */
export default function ThreatScoreGauge({
  score,
  loading,
}: {
  score: number;
  loading?: boolean;
}) {
  const { label, tone, color } = band(score);

  const options: ApexOptions = {
    colors: [color],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 260,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "70%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "40px",
            fontWeight: "700",
            offsetY: -10,
            color: "#1D2939",
            formatter: (val) => String(Math.round(val)),
          },
        },
      },
    },
    fill: { type: "solid", colors: [color] },
    stroke: { lineCap: "round" },
    labels: ["Threat Score"],
  };

  const toneClass: Record<Tone, string> = {
    primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
    light: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
    dark: "bg-gray-800 text-white",
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Threat Score</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${toneClass[tone]}`}>
          {label}
        </span>
      </div>
      <div className="relative -mb-6 -mt-2">
        {loading ? (
          <div className="flex h-[260px] items-center justify-center text-theme-sm text-gray-400">
            Loading…
          </div>
        ) : (
          <Chart options={options} series={[score]} type="radialBar" height={260} />
        )}
      </div>
      <p className="text-center text-theme-xs text-gray-400">
        0-100, computed from the last 24h of detections plus open incidents/emergencies.
      </p>
    </div>
  );
}
