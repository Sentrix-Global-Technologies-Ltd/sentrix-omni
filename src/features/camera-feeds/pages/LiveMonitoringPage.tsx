import { useMemo, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import LiveCameraGrid, { type GridLayout } from "../components/LiveCameraGrid";
import LiveAiTimeline from "../components/LiveAiTimeline";
import type { CameraSource } from "../api/camera-feeds.types";
import "../styles/live-monitoring.css";

/* ── Inline SVG icons — no lucide-react ────────────────────────────────── */
function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5"/><line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5"/><line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5"/>
    </svg>
  );
}
function IconGrid1() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  );
}
function IconGrid2() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/>
    </svg>
  );
}
function IconGrid4() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
      <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
    </svg>
  );
}
function IconGrid6() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="5" height="8" rx="0.75"/>
      <rect x="9.5" y="3"  width="5" height="8" rx="0.75"/>
      <rect x="16" y="3"  width="5" height="8" rx="0.75"/>
      <rect x="3"  y="13" width="5" height="8" rx="0.75"/>
      <rect x="9.5" y="13" width="5" height="8" rx="0.75"/>
      <rect x="16" y="13" width="5" height="8" rx="0.75"/>
    </svg>
  );
}
function IconGrid8() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2"   y="3"  width="4.5" height="8" rx="0.75"/>
      <rect x="7.5" y="3"  width="4.5" height="8" rx="0.75"/>
      <rect x="13"  y="3"  width="4.5" height="8" rx="0.75"/>
      <rect x="18.5" y="3"  width="3.5" height="8" rx="0.75"/>
      <rect x="2"   y="13" width="4.5" height="8" rx="0.75"/>
      <rect x="7.5" y="13" width="4.5" height="8" rx="0.75"/>
      <rect x="13"  y="13" width="4.5" height="8" rx="0.75"/>
      <rect x="18.5" y="13" width="3.5" height="8" rx="0.75"/>
    </svg>
  );
}
function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "lm-refresh-icon-spinning" : undefined}
    >
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  );
}

const LAYOUTS: { value: GridLayout; Icon: React.ComponentType; label: string }[] = [
  { value: "list", Icon: IconList,  label: "List view" },
  { value: 1,      Icon: IconGrid1, label: "Single camera" },
  { value: 2,      Icon: IconGrid2, label: "2-camera grid" },
  { value: 4,      Icon: IconGrid4, label: "4-camera grid" },
  { value: 6,      Icon: IconGrid6, label: "6-camera grid" },
  { value: 8,      Icon: IconGrid8, label: "8-camera grid" },
];

/**
 * Live Monitoring — real-time camera wall.
 *
 * Right sidebar removed; main area now fills full width.
 * Layout modes: list | 1 | 2 | 4 | 6 | 8.
 * Refresh triggers a real useCameraFeeds refetch.
 */
export default function LiveMonitoringPage() {
  const [site, setSite] = useState("");
  const [layout, setLayout] = useState<GridLayout>(4);
  const [refreshing, setRefreshing] = useState(false);

  const query = useCameraFeeds({ site });
  const sources = useMemo(() => query.data?.data ?? [], [query.data]);

  // Unique sites for site filter
  const siteOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sources) {
      if (s.site) seen.add(s.site);
    }
    return Array.from(seen);
  }, [sources]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  // No-op handlers kept for LiveCameraGrid API compatibility
  const handleSelect = (_source: CameraSource) => { /* selection no longer drives a sidebar */ };
  const handleFullscreen = (_source: CameraSource) => { /* tile handles its own fullscreen */ };

  const isLive = !query.isError && !query.isLoading && Boolean(query.data);

  return (
    <>
      <PageMeta
        title="Live Monitoring | Sentrix Console"
        description="Real-time camera feeds across your sites"
      />

      {/* Toolbar */}
      <div className="lm-toolbar">
        <div className="lm-toolbar-left">
          <span className="lm-toolbar-title">Vision Guard</span>
          <span style={{ color: "var(--color-gray-400)", fontSize: "0.875rem" }}>›</span>
          <span className="lm-toolbar-title">Live Monitoring</span>
          <RealtimeIndicator connected={isLive} />
        </div>

        <div className="lm-toolbar-right">
          {/* Site filter */}
          {siteOptions.length > 0 && (
            <select
              className="lm-site-select"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              aria-label="Filter by site"
            >
              <option value="">All Sites</option>
              {siteOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Layout selectors */}
          {LAYOUTS.map(({ value, Icon, label }) => (
            <button
              key={String(value)}
              className={`lm-layout-btn${layout === value ? " active" : ""}`}
              onClick={() => setLayout(value)}
              title={label}
              aria-pressed={layout === value}
              aria-label={label}
            >
              <Icon />
            </button>
          ))}

          {/* Refresh — triggers real useCameraFeeds refetch */}
          <button
            className={`lm-refresh-btn${refreshing ? " spinning" : ""}`}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-label="Refresh camera feeds"
          >
            <IconRefresh spinning={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main workspace — full width, no right rail */}
      <div className="lm-workspace-single">
        <LiveCameraGrid
          sources={sources}
          layout={layout}
          selectedId={null}
          onSelect={handleSelect}
          onFullscreen={handleFullscreen}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />

        {/* AI Detection Timeline */}
        <LiveAiTimeline cameraSourceId={null} />
      </div>
    </>
  );
}
