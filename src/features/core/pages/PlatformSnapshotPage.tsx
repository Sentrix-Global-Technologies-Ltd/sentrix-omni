import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { AlertHexaIcon, BoltIcon, GroupIcon } from "../../../icons";
import { titleCase } from "../../../lib/format";
import { usePlatformSnapshot } from "../hooks/usePlatformSnapshot";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

const severityTone: Record<string, "error" | "warning" | "info" | "light"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "light",
};

export default function PlatformSnapshotPage() {
  const query = usePlatformSnapshot();
  const cc = query.data?.data;
  const bySeverity = Object.entries(cc?.open_incidents_by_severity ?? {});

  return (
    <>
      <PageMeta title="Platform Snapshot | Sentrix Console" description="Platform-wide operational snapshot" />
      <PageHeader title="Platform Snapshot" breadcrumbs={[{ label: "Platform Snapshot" }]} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Open incidents"
            tone="warning"
            icon={<AlertHexaIcon className="size-6" />}
            loading={query.isLoading}
            value={cc?.open_incidents_total ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="Active emergencies"
            tone="error"
            icon={<BoltIcon className="size-6" />}
            loading={query.isLoading}
            value={cc?.active_emergencies ?? 0}
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            label="On-duty responders"
            tone="success"
            icon={<GroupIcon className="size-6" />}
            loading={query.isLoading}
            value={cc?.on_duty_responders ?? 0}
          />
        </div>
      </div>

      <div className={`${card} mt-6`}>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Open incidents by severity
        </h3>
        {bySeverity.length === 0 ? (
          <p className="mt-4 text-theme-sm text-gray-400">No open incidents.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-4">
            {bySeverity.map(([sev, count]) => (
              <div key={sev} className="flex items-center gap-2">
                <StatusBadge tone={severityTone[sev] ?? "light"}>{titleCase(sev)}</StatusBadge>
                <span className="tabular-nums font-semibold text-gray-800 dark:text-white/90">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
