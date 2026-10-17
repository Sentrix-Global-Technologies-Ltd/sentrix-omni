import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import IntelTrendChart from "../components/IntelTrendChart";
import IntelResponseChart from "../components/IntelResponseChart";
import { useIntelAnalytics, useIntelExport, useIntelReport } from "../hooks/useIntel";
import type { IntelRange } from "../api/intel.types";
import "../../incidents/styles/incidents-centre.css";

const RANGES: { value: IntelRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

/* ─── KPI card (mirrors IncidentKpiCards pattern) ─────────────────────── */

type Accent = "critical" | "warning" | "info" | "success" | "neutral";

interface KpiCardProps {
  label: string;
  value: number;
  sub?: string;
  accent: Accent;
  loading?: boolean;
}

function KpiCard({ label, value, sub, accent, loading }: KpiCardProps) {
  return (
    <div className="ic-stat-card">
      <p className="ic-stat-label">{label}</p>
      {loading ? (
        <div className="ic-stat-skeleton" />
      ) : (
        <p className="ic-stat-value">{value.toLocaleString()}</p>
      )}
      {sub && <p className="ic-stat-sub">{sub}</p>}
      <div className={`ic-stat-accent ic-stat-accent--${accent}`} />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function IntelConsolePage() {
  const [range, setRange] = useState<IntelRange>("7d");
  const toast = useToast();

  const reportQuery = useIntelReport(range);
  const analyticsQuery = useIntelAnalytics(range, "day");
  const exportCsv = useIntelExport();

  const onExport = async () => {
    try {
      await exportCsv.mutateAsync(range);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not export the report.");
    }
  };

  const r = reportQuery.data?.data;
  const a = analyticsQuery.data?.data;

  return (
    <>
      <PageMeta title="Intel | Sentrix Console" description="Operational intelligence" />
      <PageHeader
        title="Intel"
        breadcrumbs={[{ label: "Intel" }]}
        actions={
          <div className="flex items-center gap-2">
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
            <Can permission="intel.export">
              <Button size="sm" variant="outline" disabled={exportCsv.isPending} onClick={onExport}>
                {exportCsv.isPending ? "Exporting…" : "Export CSV"}
              </Button>
            </Can>
          </div>
        }
      />

      {/* Volume KPIs */}
      <div className="ic-kpi-grid">
        <KpiCard
          label="Incidents"
          value={r?.incidents.total ?? 0}
          sub="This period"
          accent="warning"
          loading={reportQuery.isLoading}
        />
        <KpiCard
          label="Emergencies"
          value={r?.emergencies.total ?? 0}
          sub="This period"
          accent="critical"
          loading={reportQuery.isLoading}
        />
        <KpiCard
          label="Trips"
          value={r?.trips.total ?? 0}
          sub="This period"
          accent="info"
          loading={reportQuery.isLoading}
        />
        <KpiCard
          label="Observations"
          value={r?.observations.total ?? 0}
          sub="This period"
          accent="neutral"
          loading={reportQuery.isLoading}
        />
      </div>

      {/* Response times + Incidents over time — equal halves */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        {/* Response times — ApexCharts horizontal bar */}
        <div className="col-span-12 xl:col-span-6">
          <IntelResponseChart rt={r?.response_time_seconds} />
        </div>

        {/* Incidents over time — interactive bar chart */}
        <div className="col-span-12 xl:col-span-6">
          <IntelTrendChart
            title="Incidents over time"
            points={a?.trends.incidents ?? []}
          />
        </div>
      </div>
    </>
  );
}
