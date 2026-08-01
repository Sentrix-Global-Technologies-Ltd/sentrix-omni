import { titleCase } from "./intelFormat";
import type { ThreatFactor } from "../api/intel.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-theme-xs text-gray-400">new</span>;
  }
  const up = pct > 0;
  const flat = pct === 0;
  const tone = flat
    ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
    : up
      ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
      : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  const sign = up ? "+" : "";

  return (
    <span className={`rounded-full px-2 py-0.5 text-theme-xs font-medium ${tone}`}>
      {sign}
      {pct}%
    </span>
  );
}

/** Top contributing detection types behind the current Threat Score, each
 * with its % change vs. the prior equal-length window (see
 * ThreatScoreService::topFactors). */
export default function ThreatFactorsList({
  factors,
  loading,
}: {
  factors: ThreatFactor[];
  loading?: boolean;
}) {
  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Contributing factors</h3>
      {loading ? (
        <p className="mt-4 text-theme-sm text-gray-400">Loading…</p>
      ) : factors.length === 0 ? (
        <p className="mt-4 text-theme-sm text-gray-400">No detections in the last 24h.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {factors.map((f) => (
            <li key={f.type} className="flex items-center justify-between gap-3">
              <span className="text-theme-sm text-gray-600 dark:text-gray-300">{titleCase(f.type)}</span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {f.count}
                </span>
                <ChangeBadge pct={f.change_pct} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
