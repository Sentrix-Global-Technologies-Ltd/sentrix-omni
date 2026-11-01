import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { formatDuration } from "./intelFormat";
import type { IntelReport } from "../api/intel.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

type RT = IntelReport["response_time_seconds"];

interface Props {
  rt: RT | undefined;
}

const LABELS = [
  "Incident dispatch (avg)",
  "Incident dispatch (median)",
  "Emergency ack (avg)",
  "Emergency ack (median)",
];

/* Two-tone: brand for incident metrics, error-red for emergency metrics */
const BAR_COLORS = ["#465fff", "#465fff", "#f04438", "#f04438"];

export default function IntelResponseChart({ rt }: Props) {
  const rawValues = [
    rt?.incident_dispatch.average ?? null,
    rt?.incident_dispatch.median ?? null,
    rt?.emergency_acknowledge.average ?? null,
    rt?.emergency_acknowledge.median ?? null,
  ];

  const isEmpty = rawValues.every((v) => v == null);
  const data = rawValues.map((v) => (v != null ? Math.round(v) : 0));
  const measured = rt?.combined.measured ?? 0;

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      background: "transparent",
    },
    colors: isEmpty ? ["#e5e7eb"] : BAR_COLORS,
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "52%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        distributed: true,
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: LABELS,
      labels: {
        style: { colors: "#9ca3af", fontSize: "11px", fontFamily: "Outfit, sans-serif" },
        formatter: (v: string | number) => {
          const n = typeof v === "string" ? parseFloat(v) : v;
          return isNaN(n) || n === 0 ? "0s" : formatDuration(n);
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#6b7280", fontSize: "11px", fontFamily: "Outfit, sans-serif" },
        maxWidth: 180,
      },
    },
    grid: {
      borderColor: "rgba(107,114,128,0.12)",
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { left: 4, right: 16 },
    },
    tooltip: {
      theme: "dark",
      x: { show: true },
      y: {
        formatter: (_val: number, opts?: { dataPointIndex?: number }) => {
          const i = opts?.dataPointIndex ?? 0;
          return formatDuration(rawValues[i]);
        },
      },
    },
    fill: { opacity: isEmpty ? 0.4 : 1 },
    states: {
      hover: { filter: { type: "darken" } },
    },
  };

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Response times</h3>

      <div className="relative mt-2">
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="rounded-md bg-white/80 px-3 py-1 text-theme-sm text-gray-400 dark:bg-gray-900/80">
              No data in range.
            </p>
          </div>
        )}
        <Chart options={options} series={[{ name: "Seconds", data }]} type="bar" height={220} />
      </div>

      <p className="mt-1 border-t border-gray-100 pt-3 text-theme-xs text-gray-400 dark:border-gray-800">
        Based on {measured} measured events in range.
      </p>
    </div>
  );
}
