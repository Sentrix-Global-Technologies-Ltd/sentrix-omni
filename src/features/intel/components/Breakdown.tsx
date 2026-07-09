import { titleCase } from "./intelFormat";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** A labeled count breakdown rendered as proportional bars. */
export default function Breakdown({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-4 text-theme-sm text-gray-400">No data in range.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="flex items-center justify-between text-theme-sm">
                <span className="text-gray-600 dark:text-gray-300">{titleCase(k)}</span>
                <span className="tabular-nums font-medium text-gray-800 dark:text-white/90">{v}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
