import { Link } from "react-router";
import Badge from "../../../components/ui/badge/Badge";
import ProgressBar from "../../../components/ui/progressbar/ProgressBar";
import { useThreatScore } from "../../intel/hooks/useIntel";
import type { Tone } from "../../../components/ui/tone";

function band(score: number): { label: string; tone: Tone } {
  if (score >= 70) return { label: "Critical", tone: "error" };
  if (score >= 35) return { label: "Elevated", tone: "warning" };
  return { label: "Nominal", tone: "success" };
}

export default function ThreatScoreSummaryCard() {
  const { data: result, isLoading, isError } = useThreatScore();
  const data = result?.data;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  // ── Error / unavailable state ────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Threat Score unavailable
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Could not load threat data. It will retry automatically.
        </p>
        <Link
          to="/vision-guard/ai-analytics"
          className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Open AI Analytics →
        </Link>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  const { score, open_incidents_count, active_emergencies_count, factors } =
    data;
  const { label, tone } = band(score);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Threat Score
        </span>
        <Badge color={tone} variant="light" size="sm">
          {label}
        </Badge>
      </div>

      {/* Score */}
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {Math.round(score)}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500">/100</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar progress={score} size="md" />
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Factors</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {factors.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Incidents</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {open_incidents_count}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Emergencies
          </p>
          <p
            className={`text-sm font-semibold ${
              active_emergencies_count > 0
                ? "text-error-600 dark:text-error-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {active_emergencies_count}
          </p>
        </div>
      </div>

      {/* Link — always rendered */}
      <Link
        to="/vision-guard/ai-analytics"
        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        View full AI Analytics →
      </Link>
    </div>
  );
}
