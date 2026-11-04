import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import AccentStatCard, { type StatAccent } from "../../../components/shared/AccentStatCard";
import { titleCase } from "../../../lib/format";
import { usePlatformSnapshot } from "../hooks/usePlatformSnapshot";

const severityAccent: Record<string, StatAccent> = {
  critical: "critical",
  high: "warning",
  medium: "info",
  low: "neutral",
};

const severityOrder = ["low", "medium", "high", "critical"];

export default function PlatformSnapshotPage() {
  const query = usePlatformSnapshot();
  const cc = query.data?.data;
  const bySeverity = Object.entries(cc?.open_incidents_by_severity ?? {}).sort(
    ([a], [b]) => (severityOrder.indexOf(a) + 100) % 100 - ((severityOrder.indexOf(b) + 100) % 100),
  );

  return (
    <>
      <PageMeta title="Platform Snapshot | Sentrix Console" description="Platform-wide operational snapshot" />
      <PageHeader title="Platform Snapshot" breadcrumbs={[{ label: "Platform Snapshot" }]} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AccentStatCard
          label="Open incidents"
          accent="warning"
          sub="Awaiting action"
          loading={query.isLoading}
          value={cc?.open_incidents_total ?? 0}
        />
        <AccentStatCard
          label="Active emergencies"
          accent="critical"
          sub="Needs attention"
          loading={query.isLoading}
          value={cc?.active_emergencies ?? 0}
        />
        <AccentStatCard
          label="On-duty responders"
          accent="success"
          sub="Currently on shift"
          loading={query.isLoading}
          value={cc?.on_duty_responders ?? 0}
        />
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-800 dark:text-white/90">
        Open incidents by severity
      </h3>
      {bySeverity.length === 0 ? (
        <p className="text-theme-sm text-gray-400">No open incidents.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {bySeverity.map(([sev, count]) => (
            <AccentStatCard
              key={sev}
              label={titleCase(sev)}
              accent={severityAccent[sev] ?? "neutral"}
              value={count}
              sub="Open"
            />
          ))}
        </div>
      )}
    </>
  );
}
