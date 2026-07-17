import { useOutcomeStats } from "../../core/hooks/useOutcomeStats";
import { titleCase } from "./intelFormat";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Operator outcome tracking (item 20 of the POC gap list). Deliberately NOT
 * framed as "continual learning" or model retraining — no such pipeline
 * exists (SentrixCore's vision provider calls a fixed hosted model per frame;
 * see Outcome::statsByKind()'s docblock). This is the honest version: a real,
 * durably recorded per-situation-type resolution rate, built from operators
 * confirming outcomes through the assistant's `record_outcome` tool.
 */
export default function OutcomeTrackingPanel() {
  const query = useOutcomeStats();
  const byKind = query.data?.data.by_kind ?? {};
  const entries = Object.entries(byKind).sort((a, b) => b[1].samples - a[1].samples);

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Operator outcome tracking</h3>
      <p className="mt-1 text-theme-xs text-gray-400">
        Resolution rate per situation type, from responses operators have confirmed via the assistant.
      </p>
      {query.isLoading ? (
        <p className="mt-4 text-theme-sm text-gray-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-theme-sm text-gray-400">No outcomes recorded yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(([kind, s]) => (
            <div key={kind}>
              <div className="flex items-center justify-between text-theme-sm">
                <span className="text-gray-600 dark:text-gray-300">{titleCase(kind)}</span>
                <span className="tabular-nums font-medium text-gray-800 dark:text-white/90">
                  {s.rate !== null ? `${Math.round(s.rate * 100)}%` : "—"}
                  <span className="ml-1 text-theme-xs text-gray-400">({s.samples})</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${(s.rate ?? 0) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
