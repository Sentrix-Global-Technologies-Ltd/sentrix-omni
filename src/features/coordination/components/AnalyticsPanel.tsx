import { useState } from "react";
import StatCard from "../../../components/shared/StatCard";
import FilterBar from "../../../components/shared/FilterBar";
import { CheckCircleIcon, GroupIcon, PieChartIcon, TimeIcon } from "../../../icons";
import { useCoordinationAnalytics } from "../hooks/useCoordination";

const WINDOW_OPTIONS = [7, 30, 90];

/**
 * Command analytics — read-only computed rollup (no write actions, matching
 * the backend's `analytics()` endpoint, which is GET-only).
 */
export default function AnalyticsPanel() {
  const [days, setDays] = useState(30);
  const analytics = useCoordinationAnalytics(days);
  const a = analytics.data?.data;

  return (
    <>
      <FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-theme-xs text-gray-400">Window</span>
          {WINDOW_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full border px-3 py-1 text-theme-sm transition ${
                days === d
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </FilterBar>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Incidents (open / total)"
            tone="warning"
            icon={<GroupIcon className="size-6" />}
            loading={analytics.isLoading}
            value={`${a?.incidents.open ?? 0} / ${a?.incidents.total ?? 0}`}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Avg. response time"
            tone="info"
            icon={<TimeIcon className="size-6" />}
            loading={analytics.isLoading}
            value={a?.response_time_seconds.average != null ? `${a.response_time_seconds.average}s` : "—"}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="SLA dispatch compliance"
            tone="success"
            icon={<CheckCircleIcon className="size-6" />}
            loading={analytics.isLoading}
            value={a?.sla_dispatch.compliance_pct != null ? `${a.sla_dispatch.compliance_pct}%` : "—"}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Unit utilization"
            tone="primary"
            icon={<PieChartIcon className="size-6" />}
            loading={analytics.isLoading}
            value={a?.unit_utilization.pct != null ? `${a.unit_utilization.pct}%` : "—"}
          />
        </div>
      </div>
    </>
  );
}
