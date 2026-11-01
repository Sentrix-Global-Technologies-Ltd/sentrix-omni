import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { TrendPoint } from "../api/intel.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Format a bucket string (ISO date or day label) into a short display label.
 * "2024-01-05" → "Jan 5", "2024-01-05T00:00:00Z" → "Jan 5", plain strings pass through.
 */
function bucketLabel(bucket: string): string {
  // ISO date strings
  if (/^\d{4}-\d{2}-\d{2}/.test(bucket)) {
    const d = new Date(bucket);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }
  return bucket;
}

interface Props {
  title: string;
  points: TrendPoint[];
  color?: string;
}

export default function IntelTrendChart({
  title,
  points,
  color = "#465fff",
}: Props) {
  const total = points.reduce((s, p) => s + p.count, 0);
  const categories = points.map((p) => bucketLabel(p.bucket));
  const data = points.map((p) => p.count);

  /* Widen chart when many buckets to allow horizontal scroll */
  const minWidth = Math.max(0, points.length * 28);

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
    colors: [color],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "52%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9ca3af", fontSize: "11px", fontFamily: "Outfit, sans-serif" },
        rotate: points.length > 20 ? -45 : 0,
        rotateAlways: false,
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af", fontSize: "11px", fontFamily: "Outfit, sans-serif" },
        formatter: (v: number) => (Number.isInteger(v) ? String(v) : ""),
      },
      min: 0,
    },
    grid: {
      borderColor: "rgba(107,114,128,0.12)",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 4 },
    },
    tooltip: {
      theme: "dark",
      x: { show: true },
      y: { formatter: (v: number) => `${v}` },
    },
    fill: { opacity: 1 },
    states: {
      hover: { filter: { type: "darken" } },
    },
  };

  /* When no data, render a ghosted placeholder chart so the layout is visible */
  const isEmpty = points.length === 0;
  const placeholderCategories = isEmpty
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : categories;
  const placeholderData = isEmpty ? [0, 0, 0, 0, 0, 0, 0] : data;

  const resolvedOptions: ApexOptions = {
    ...options,
    xaxis: { ...options.xaxis, categories: placeholderCategories },
    yaxis: {
      ...(options.yaxis as object),
      max: isEmpty ? 10 : undefined,
    },
    colors: isEmpty ? ["#e5e7eb"] : [color],
  };

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        <span className="text-theme-xs text-gray-400">{total.toLocaleString()} total</span>
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="rounded-md bg-white/80 px-3 py-1 text-theme-sm text-gray-400 dark:bg-gray-900/80">
              No data in range.
            </p>
          </div>
        )}
        <div className="overflow-x-auto custom-scrollbar">
          <div style={{ minWidth: minWidth > 0 ? `${minWidth}px` : undefined }}>
            <Chart
              options={resolvedOptions}
              series={[{ name: title, data: placeholderData }]}
              type="bar"
              height={220}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
