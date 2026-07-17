import { useCommunityHotspots } from "../hooks/useCommunityHotspots";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Community Hotspots — the Operations Command Center's density read over
 * crowdsourced community alerts (item 19 of the POC gap list). Same
 * proportional-bar list pattern Intel's Breakdown panel already uses; no map
 * component exists in this codebase today (Intel's own heatmap data isn't
 * rendered visually either), so a ranked cell list is the honest fit rather
 * than introducing a new mapping library for one panel. Platform-wide, not
 * scoped to the viewer's organization — community alerts carry no
 * organization_id (see CommunityAlertService::hotspots()).
 */
export default function CommunityHotspotPanel() {
  const query = useCommunityHotspots(8);
  const cells = query.data?.data.cells ?? [];
  const max = Math.max(1, ...cells.map((c) => c.count));

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Community hotspots</h3>
      {query.isLoading ? (
        <p className="mt-4 text-theme-sm text-gray-400">Loading…</p>
      ) : cells.length === 0 ? (
        <p className="mt-4 text-theme-sm text-gray-400">No active community reports right now.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {cells.map((c) => (
            <div key={c.cell}>
              <div className="flex items-center justify-between text-theme-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                </span>
                <span className="tabular-nums font-medium text-gray-800 dark:text-white/90">{c.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${(c.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
