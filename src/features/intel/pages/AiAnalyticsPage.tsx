import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import StatCard from "../../../components/shared/StatCard";
import { AlertHexaIcon, BoltIcon, ShootingStarIcon } from "../../../icons";
import ThreatScoreGauge from "../components/ThreatScoreGauge";
import ThreatFactorsList from "../components/ThreatFactorsList";
import TrendBars from "../components/TrendBars";
import { useThreatScore, useThreatScoreHistory } from "../hooks/useIntel";

/**
 * AI Analytics — the Threat Score is a real aggregation over
 * detection_events.risk_score (produced by DecisionEngine from Sentrix
 * Core's vision analysis), not a separate/fabricated model. See
 * ThreatScoreService's own docblock for the exact formula.
 */
export default function AiAnalyticsPage() {
  const scoreQuery = useThreatScore();
  const historyQuery = useThreatScoreHistory(24 * 7);

  const s = scoreQuery.data?.data;
  const history = historyQuery.data?.data ?? [];

  const trendPoints = history.map((h) => ({
    bucket: new Date(h.computed_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
    }),
    count: h.score,
  }));

  return (
    <>
      <PageMeta title="AI Analytics | Sentrix Console" description="Threat Score and AI-driven analytics" />
      <PageHeader
        title="AI Analytics"
        breadcrumbs={[{ label: "Vision Guard" }, { label: "AI Analytics" }]}
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4">
          <ThreatScoreGauge score={s?.score ?? 0} loading={scoreQuery.isLoading} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ThreatFactorsList factors={s?.factors ?? []} loading={scoreQuery.isLoading} />
        </div>
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 md:gap-6">
          <StatCard
            label="Avg risk (24h)"
            tone="primary"
            icon={<ShootingStarIcon className="size-6" />}
            loading={scoreQuery.isLoading}
            value={s?.avg_risk_score ?? 0}
          />
          <StatCard
            label="Open incidents"
            tone="warning"
            icon={<AlertHexaIcon className="size-6" />}
            loading={scoreQuery.isLoading}
            value={s?.open_incidents_count ?? 0}
          />
          <StatCard
            label="Active emergencies"
            tone="error"
            icon={<BoltIcon className="size-6" />}
            loading={scoreQuery.isLoading}
            value={s?.active_emergencies_count ?? 0}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <TrendBars title="Threat Score — last 7 days (hourly)" points={trendPoints} color="var(--color-brand-500, #465fff)" />
        </div>
      </div>
    </>
  );
}
