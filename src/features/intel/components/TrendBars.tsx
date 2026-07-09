import type { TrendPoint } from "../api/intel.types";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/** Compact bar chart for a time-bucketed trend (no chart lib). */
export default function TrendBars({
  title,
  points,
  color = "var(--color-brand-500, #465fff)",
}: {
  title: string;
  points: TrendPoint[];
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        <span className="text-theme-xs text-gray-400">{total} total</span>
      </div>
      {points.length === 0 ? (
        <p className="mt-4 text-theme-sm text-gray-400">No data in range.</p>
      ) : (
        <div className="mt-4 flex h-32 items-end gap-1">
          {points.map((p) => (
            <div
              key={p.bucket}
              title={`${p.bucket}: ${p.count}`}
              className="flex-1 rounded-t transition-all"
              style={{ height: `${Math.max(4, (p.count / max) * 100)}%`, backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
