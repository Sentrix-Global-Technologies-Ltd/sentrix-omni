import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { ApiError } from "../../../services/api/errors";
import { AlertHexaIcon, BoltIcon, FileIcon, TaskIcon } from "../../../icons";
import Breakdown from "../components/Breakdown";
import TrendBars from "../components/TrendBars";
import { formatDuration } from "../components/intelFormat";
import { useIntelAnalytics, useIntelExport, useIntelReport } from "../hooks/useIntel";
import type { IntelRange } from "../api/intel.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const RANGES: { value: IntelRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="tabular-nums font-medium text-gray-800 dark:text-white/90">{value}</span>
    </div>
  );
}

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
  const rt = r?.response_time_seconds;

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
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Incidents"
            tone="warning"
            icon={<AlertHexaIcon className="size-6" />}
            loading={reportQuery.isLoading}
            value={r?.incidents.total ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Emergencies"
            tone="error"
            icon={<BoltIcon className="size-6" />}
            loading={reportQuery.isLoading}
            value={r?.emergencies.total ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Trips"
            tone="info"
            icon={<TaskIcon className="size-6" />}
            loading={reportQuery.isLoading}
            value={r?.trips.total ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Observations"
            tone="primary"
            icon={<FileIcon className="size-6" />}
            loading={reportQuery.isLoading}
            value={r?.observations.total ?? 0}
          />
        </div>
      </div>

      {/* Response times + trends */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4">
          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Response times</h3>
            <div className="mt-4 space-y-3">
              <Stat label="Incident dispatch (avg)" value={formatDuration(rt?.incident_dispatch.average ?? null)} />
              <Stat label="Incident dispatch (median)" value={formatDuration(rt?.incident_dispatch.median ?? null)} />
              <Stat label="Emergency ack (avg)" value={formatDuration(rt?.emergency_acknowledge.average ?? null)} />
              <Stat label="Emergency ack (median)" value={formatDuration(rt?.emergency_acknowledge.median ?? null)} />
            </div>
            <p className="mt-4 border-t border-gray-100 pt-3 text-theme-xs text-gray-400 dark:border-gray-800">
              Based on {rt?.combined.measured ?? 0} measured events in range.
            </p>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <TrendBars title="Incidents over time" points={a?.trends.incidents ?? []} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <TrendBars
            title="Emergencies over time"
            points={a?.trends.emergencies ?? []}
            color="var(--color-error-500, #f04438)"
          />
        </div>
      </div>

      {/* Breakdowns */}
      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Breakdown title="Incidents by severity" data={r?.incidents.by_severity ?? {}} />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Breakdown title="Emergencies by status" data={r?.emergencies.by_status ?? {}} />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Breakdown title="Observations by kind" data={a?.breakdowns.observations_by_kind ?? {}} />
        </div>
      </div>
    </>
  );
}
