import { useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Link } from "react-router";
import { ChevronDownIcon } from "../../../icons";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useOrganization } from "../../../context/OrganizationContext";

// ─── Range config ────────────────────────────────────────────────────────────

type RangeKey = "7d" | "14d" | "30d";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d",  label: "Last 7 Days",  days: 7  },
  { key: "14d", label: "Last 14 Days", days: 14 },
  { key: "30d", label: "Last 30 Days", days: 30 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function axisLabel(d: Date, days: number): string {
  if (days <= 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" }); // "Mon"
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "Jan 5"
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Incident analytics area chart for the non-SuperAdmin dashboard row.
 * Replaces the static Quick Insights list with a live orange-gradient
 * area chart showing incidents per day, a period-range selector, and a
 * "% vs previous period" badge.
 *
 * Data source: useIncidents({ per_page: 200 }) — the 200 most-recent
 * incidents, grouped client-side by opened_at date.
 */
export default function IncidentAnalyticsChart({ className }: { className?: string }) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { activeId } = useOrganization();

  // Fetch enough incidents to cover the selected range + its comparison period.
  const { data, isLoading } = useIncidents({ per_page: 200 });
  const incidents = data?.data ?? [];

  const activeRange = RANGES.find((r) => r.key === range)!;
  const days = activeRange.days;

  // ── Derive daily series ─────────────────────────────────────────────────
  const { categories, series, pctChange, dayDeltas } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Current period days (newest first, then reversed)
    const currentDates: Date[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      currentDates.push(d);
    }

    // Prior period days (same length, immediately before current)
    const priorDates: Date[] = [];
    for (let i = days * 2 - 1; i >= days; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      priorDates.push(d);
    }

    // Build date → count map
    const byDate: Record<string, number> = {};
    for (const inc of incidents) {
      if (!inc.opened_at) continue;
      const key = toIsoDate(new Date(inc.opened_at));
      byDate[key] = (byDate[key] ?? 0) + 1;
    }

    const current = currentDates.map((d) => byDate[toIsoDate(d)] ?? 0);
    const prior   = priorDates.map((d) => byDate[toIsoDate(d)] ?? 0);

    const totalCurrent = current.reduce((a, b) => a + b, 0);
    const totalPrior   = prior.reduce((a, b) => a + b, 0);
    const pctChange =
      totalPrior === 0
        ? totalCurrent > 0 ? 100 : 0
        : Math.round(((totalCurrent - totalPrior) / totalPrior) * 100);

    // Per-day delta for tooltip
    const dayDeltas = current.map((curr, i) => {
      const p = prior[i] ?? 0;
      if (p === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - p) / p) * 100);
    });

    return {
      categories: currentDates.map((d) => axisLabel(d, days)),
      series:     current,
      pctChange,
      dayDeltas,
    };
  }, [incidents, days]);

  // ── ApexCharts options ──────────────────────────────────────────────────
  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom:    { enabled: false },
      sparkline: { enabled: false },
      animations: { enabled: !isLoading, speed: 600 },
      background: "transparent",
    },
    colors: ["#F59E0B"],
    fill: {
      type: "gradient",
      gradient: {
        type: "vertical",
        shadeIntensity: 1,
        colorStops: [
          { offset: 0,   color: "#F59E0B", opacity: 0.38 },
          { offset: 100, color: "#F59E0B", opacity: 0.02 },
        ],
      },
    },
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      hover: { size: 5 },
      strokeWidth: 2,
      fillOpacity: 1,
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks:  { show: false },
      crosshairs: {
        show: true,
        stroke: { color: "rgba(107,114,128,0.3)", width: 1, dashArray: 4 },
      },
      labels: {
        style: {
          colors: Array(categories.length).fill("#9ca3af"),
          fontSize: "11px",
          fontFamily: "Outfit, sans-serif",
        },
      },
    },
    yaxis: {
      tickAmount: 3,
      min: 0,
      labels: {
        style: {
          colors: ["#9ca3af"],
          fontSize: "11px",
          fontFamily: "Outfit, sans-serif",
        },
        formatter: (v: number) => (Number.isInteger(v) ? String(v) : ""),
      },
    },
    grid: {
      borderColor: "rgba(107,114,128,0.12)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true  } },
      padding: { left: 4, right: 4, top: 0, bottom: 0 },
    },
    tooltip: {
      theme: "dark",
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const label  = categories[dataPointIndex] ?? "";
        const count  = series[dataPointIndex] ?? 0;
        const pct    = dayDeltas[dataPointIndex] ?? 0;
        const isDown = pct <= 0;
        const arrow  = isDown ? "↓" : "↑";
        const color  = isDown ? "#12b76a" : "#ef4444";
        const periodLabel = `last ${activeRange.label.toLowerCase().replace("last ", "")}`;
        return `<div style="padding:12px 16px;background:#1f2937;border-radius:12px;border:1px solid rgba(255,255,255,0.08);font-family:Outfit,sans-serif;min-width:168px;box-shadow:0 8px 24px rgba(0,0,0,0.4)">
          <div style="font-weight:700;font-size:14px;color:#fff;margin-bottom:4px">${label}</div>
          <div style="font-size:13px;color:#d1d5db;margin-bottom:6px">${count} incident${count !== 1 ? "s" : ""}</div>
          <div style="font-size:12px;font-weight:600;color:${color}">${arrow}${Math.abs(pct)}% vs ${periodLabel}</div>
        </div>`;
      },
    },
    legend: { show: false },
  };

  // ── Badge ───────────────────────────────────────────────────────────────
  const isDown  = pctChange <= 0;
  const arrow   = isDown ? "↓" : "↑";
  const badgeCls = isDown
    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
    : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400";

  return (
    <div className={className}>
      {/* ── Header row ── */}
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Analytics Incident
        </h3>
        <Link
          to="/incidents"
          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
        >
          View detail
        </Link>
      </div>

      {/* ── Sub-header: range picker + % badge ── */}
      <div className="mb-4 flex items-center justify-between">
        {/* Range dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronDownIcon className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            {activeRange.label}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`block w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-white/[0.04] ${
                    r.key === range
                      ? "font-semibold text-brand-600 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => { setRange(r.key); setOpen(false); }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* % badge */}
        {!isLoading && activeId && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}
          >
            {arrow}{Math.abs(pctChange)}% vs last period
          </span>
        )}
      </div>

      {/* ── Chart ── */}
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]" />
      ) : (
        <div className="-mx-1">
          <Chart
            options={options}
            series={[{ name: "Incidents", data: series }]}
            type="area"
            height={220}
          />
        </div>
      )}
    </div>
  );
}
