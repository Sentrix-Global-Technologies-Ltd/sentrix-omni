import { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import {
  AlertHexaIcon,
  BoltIcon,
  DownloadIcon,
  FileIcon,
  InfoIcon,
  ShootingStarIcon,
} from "../../../icons";
import ThreatScoreGauge from "../components/ThreatScoreGauge";
import ThreatFactorsList from "../components/ThreatFactorsList";
import Breakdown from "../components/Breakdown";
import IntelTrendChart from "../components/IntelTrendChart";
import {
  useThreatScore,
  useIntelReport,
  useIntelAnalytics,
  useIntelExport,
} from "../hooks/useIntel";
import type { IntelRange } from "../api/intel.types";
import "../../incidents/styles/incidents-centre.css";

/**
 * AI Analytics — Threat Score is a real aggregation over detection_events.risk_score
 * produced by DecisionEngine from Sentrix Core's vision analysis (ThreatScoreService).
 * The intel report and analytics data come from the same operational pipeline.
 */

const RANGES: { value: IntelRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Score band → KPI accent colour */
function scoreToneClass(score: number) {
  if (score >= 70) return "ic-stat-accent--critical";
  if (score >= 35) return "ic-stat-accent--warning";
  return "ic-stat-accent--success";
}

/* ─── Inline KPI card (re-uses the ic-stat-card CSS from incidents-centre) */
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: "critical" | "warning" | "info" | "success" | "neutral";
  icon?: React.ReactNode;
  loading?: boolean;
}

function KpiCard({ label, value, sub, accent, icon, loading }: KpiCardProps) {
  return (
    <div className="ic-stat-card">
      {icon && (
        <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
          {icon}
        </span>
      )}
      <p className="ic-stat-label">{label}</p>
      {loading ? (
        <div className="ic-stat-skeleton mt-1" />
      ) : (
        <p className="ic-stat-value">{typeof value === "number" ? value.toLocaleString() : value}</p>
      )}
      {sub && <p className="ic-stat-sub">{sub}</p>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}

/* ─── Donut chart: Observations/Incidents by category ─────────────────────── */
const DONUT_COLORS = ["#465fff", "#f79009", "#f04438", "#12b76a", "#06aed4", "#7a5af8", "#e478fa"];

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CategoryDonutProps {
  title: string;
  data: Record<string, number>;
  loading?: boolean;
}

function CategoryDonut({ title, data, loading }: CategoryDonutProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const isEmpty = entries.length === 0;

  const labels = isEmpty ? ["No data"] : entries.map(([k]) => titleCase(k));
  const series = isEmpty ? [1] : entries.map(([, v]) => v);
  const colors = isEmpty ? ["#e5e7eb"] : DONUT_COLORS.slice(0, entries.length);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 220,
      background: "transparent",
      animations: { enabled: true, speed: 400 },
    },
    colors,
    labels,
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: !isEmpty,
            total: {
              show: true,
              label: "Total",
              fontSize: "12px",
              fontFamily: "Outfit, sans-serif",
              color: "#9ca3af",
              formatter: () => String(total),
            },
            value: {
              fontSize: "22px",
              fontWeight: "700",
              fontFamily: "Outfit, sans-serif",
              color: "#1D2939",
              offsetY: 4,
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (v: number) => `${v}` },
    },
    stroke: { width: 0 },
  };

  return (
    <div className={card}>
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {loading ? (
        <div className="flex h-[220px] items-center justify-center text-theme-sm text-gray-400">
          Loading…
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {isEmpty && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <p className="rounded-md bg-white/80 px-3 py-1 text-theme-xs text-gray-400 dark:bg-gray-900/80">
                  No data in range.
                </p>
              </div>
            )}
            <Chart options={options} series={series} type="donut" height={200} width={200} />
          </div>
          {!isEmpty && (
            <div className="flex-1 space-y-2">
              {entries.slice(0, 7).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between text-theme-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: DONUT_COLORS[i] ?? "#9ca3af" }}
                    />
                    <span className="text-gray-600 dark:text-gray-300">{titleCase(k)}</span>
                  </div>
                  <span className="tabular-nums font-medium text-gray-800 dark:text-white/90">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Unavailable panel placeholder ───────────────────────────────────────── */
interface UnavailablePanelProps {
  title: string;
  reason?: string;
  icon?: React.ReactNode;
  minH?: string;
}

function UnavailablePanel({
  title,
  reason = "No backend endpoint is available for this panel.",
  icon,
  minH = "h-44",
}: UnavailablePanelProps) {
  return (
    <div className={`${card} flex flex-col`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      </div>
      <div
        className={`flex flex-1 ${minH} items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700`}
      >
        <div className="text-center">
          <InfoIcon className="mx-auto mb-2 size-5 text-gray-300 dark:text-gray-600" />
          <p className="text-theme-xs text-gray-400 dark:text-gray-500">Not available</p>
          <p className="mt-0.5 max-w-[220px] text-[11px] leading-relaxed text-gray-300 dark:text-gray-600">
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function AiAnalyticsPage() {
  const [range, setRange] = useState<IntelRange>("7d");
  const toast = useToast();

  /* Threat Score — polled every 30s (no single realtime event maps to this aggregate) */
  const scoreQuery = useThreatScore();

  /* Intel report + analytics — range-driven */
  const reportQuery = useIntelReport(range);
  const analyticsQuery = useIntelAnalytics(range, "day");
  const exportCsv = useIntelExport();

  const s = scoreQuery.data?.data;
  const r = reportQuery.data?.data;
  const a = analyticsQuery.data?.data;

  /* Observations by kind → category donut */
  const obsByKind: Record<string, number> = a?.breakdowns.observations_by_kind ?? {};

  const onExport = async () => {
    try {
      await exportCsv.mutateAsync(range);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not export the report.");
    }
  };

  /* ─── Score-band accent for the headline KPI card */
  const scoreAccent: KpiCardProps["accent"] =
    (s?.score ?? 0) >= 70 ? "critical" : (s?.score ?? 0) >= 35 ? "warning" : "success";

  const rangeLabelLong =
    range === "24h" ? "24 hours" : range === "7d" ? "7 days" : "30 days";

  return (
    <>
      <PageMeta
        title="AI Analytics | Sentrix Console"
        description="Threat Score and AI-driven analytics"
      />
      <PageHeader
        title="AI Analytics"
        breadcrumbs={[{ label: "Vision Guard" }, { label: "AI Analytics" }]}
        actions={
          <div className="flex items-center gap-2">
            {/* Range selector */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-800">
              {RANGES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
                    range === opt.value
                      ? "bg-brand-500 text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ── Row 1: KPI tiles ─────────────────────────────────────────────── */}
      <div className="ic-kpi-grid">
        <KpiCard
          label="Threat Score"
          value={s?.score ?? 0}
          sub="Current (live)"
          accent={scoreAccent}
          icon={<ShootingStarIcon className="size-5" />}
          loading={scoreQuery.isLoading}
        />
        <KpiCard
          label="Avg Risk Score"
          value={s != null ? s.avg_risk_score.toFixed(1) : "—"}
          sub="Last 24h detections"
          accent="neutral"
          icon={<ShootingStarIcon className="size-5" />}
          loading={scoreQuery.isLoading}
        />
        <KpiCard
          label="Open Incidents"
          value={s?.open_incidents_count ?? 0}
          sub="Currently open"
          accent="warning"
          icon={<AlertHexaIcon className="size-5" />}
          loading={scoreQuery.isLoading}
        />
        <KpiCard
          label="Active Emergencies"
          value={s?.active_emergencies_count ?? 0}
          sub="Requires immediate action"
          accent="critical"
          icon={<BoltIcon className="size-5" />}
          loading={scoreQuery.isLoading}
        />
        <KpiCard
          label="Incidents (period)"
          value={r?.incidents.total ?? 0}
          sub={`Last ${rangeLabelLong}`}
          accent="info"
          icon={<AlertHexaIcon className="size-5" />}
          loading={reportQuery.isLoading}
        />
      </div>

      {/* ── Row 2: Gauge + Factors + Severity Breakdown ──────────────────── */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4">
          <ThreatScoreGauge score={s?.score ?? 0} loading={scoreQuery.isLoading} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ThreatFactorsList factors={s?.factors ?? []} loading={scoreQuery.isLoading} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <Breakdown
            title="Incidents by severity"
            data={r?.incidents.by_severity ?? {}}
          />
        </div>
      </div>

      {/* ── Row 3: Incidents by Category + Alerts Over Time ─────────────── */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-5">
          <CategoryDonut
            title="Observations by category"
            data={obsByKind}
            loading={analyticsQuery.isLoading}
          />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <IntelTrendChart
            title={`Alerts (emergencies) over time — last ${rangeLabelLong}`}
            points={a?.trends.emergencies ?? []}
            color="#f04438"
          />
        </div>
      </div>

      {/* ── Row 6: Site Performance + AI Executive Summary ───────────────── */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <UnavailablePanel
            title="Site performance comparison"
            minH="h-52"
            reason="Per-site performance metrics (cameras, uptime, incidents, trend) are not yet available from the backend."
          />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <UnavailablePanel
            title="AI executive summary"
            icon={<ShootingStarIcon className="size-4" />}
            minH="h-52"
            reason="AI-generated executive summaries are not yet supported in this release."
          />
        </div>
      </div>

      {/* ── Row 8: Downloadable Reports ──────────────────────────────────── */}
      <div className="mt-6">
        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
              <FileIcon className="size-4" />
            </span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Downloadable reports
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Report
                  </th>
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Period
                  </th>
                  <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50 dark:border-gray-800/60">
                  <td className="py-3 text-gray-800 dark:text-white/90">Intel Summary</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">CSV</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{rangeLabelLong}</td>
                  <td className="py-3 text-right">
                    <Can permission="intel.export">
                      <button
                        onClick={onExport}
                        disabled={exportCsv.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-theme-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                      >
                        <DownloadIcon className="size-3.5" />
                        {exportCsv.isPending ? "Downloading…" : "Download"}
                      </button>
                    </Can>
                  </td>
                </tr>
                {/* Rows for panel types not yet backed: clearly labelled */}
                {(["Camera uptime report", "Site performance report"] as const).map((label) => (
                  <tr
                    key={label}
                    className="border-b border-gray-50 last:border-0 dark:border-gray-800/60"
                  >
                    <td className="py-3 text-gray-400 dark:text-gray-500">{label}</td>
                    <td className="py-3 text-gray-300 dark:text-gray-600">—</td>
                    <td className="py-3 text-gray-300 dark:text-gray-600">—</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-400 dark:bg-white/5 dark:text-gray-500">
                        Not available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
