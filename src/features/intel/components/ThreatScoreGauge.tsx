import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Score bands mirror the backend's own [0,100] clamp. */
function band(score: number): { label: string; color: string; badgeCls: string } {
  if (score >= 70)
    return {
      label: "Critical",
      color: "#f04438",
      badgeCls:
        "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
    };
  if (score >= 35)
    return {
      label: "Elevated",
      color: "#f79009",
      badgeCls:
        "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    };
  return {
    label: "Nominal",
    color: "#12b76a",
    badgeCls:
      "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  };
}

/** Headline Threat Score gauge — styled to match the TailAdmin Pro radial gauge. */
export default function ThreatScoreGauge({
  score,
  loading,
}: {
  score: number;
  loading?: boolean;
}) {
  const { label, color, badgeCls } = band(score);

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
        hollow: {
          size: "58%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 0,
        },
        dataLabels: {
          show: false,
        },
      },
    },
    fill: { type: "solid", colors: [color] },
    stroke: { lineCap: "round" },
  };

  return (
    <div className={card}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Threat Score
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${badgeCls}`}
        >
          {label}
        </span>
      </div>

      {/* Gauge + overlay */}
      <div className="relative mt-2">
        {loading ? (
          <div className="flex h-[180px] items-center justify-center text-theme-sm text-gray-400">
            Loading…
          </div>
        ) : (
          <>
            {/*
             * The half-circle chart is 260px tall in sparkline mode.
             * The arc's centre point is at the very bottom of that bounding box,
             * so the arc fills the top ~130px and leaves ~130px of blank space.
             * We clip that blank space with overflow-hidden + fixed height,
             * then overlay the score + badge absolutely.
             */}
            <div
              className="relative overflow-hidden"
              style={{ height: "148px" }}
            >
              <div style={{ marginTop: "-6px" }}>
                <Chart
                  options={options}
                  series={[score]}
                  type="radialBar"
                  height={260}
                />
              </div>

              {/* Centre overlay — anchored to the arc's focal point */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
                <p className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {score}
                </p>
                <span
                  className={`mt-2 rounded-full px-2.5 py-0.5 text-theme-xs font-semibold ${badgeCls}`}
                >
                  {label}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-theme-xs text-gray-400">
        0–100 · computed from the last 24h of detections plus open
        incidents / emergencies.
      </p>
    </div>
  );
}
