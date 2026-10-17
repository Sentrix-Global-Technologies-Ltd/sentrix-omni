import { useMemo, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import LiveCameraGrid, { type GridLayout } from "../components/LiveCameraGrid";
import LiveCameraBrowser from "../components/LiveCameraBrowser";
import LiveCameraDetails from "../components/LiveCameraDetails";
import LiveQuickIncidents from "../components/LiveQuickIncidents";
import LiveAiTimeline from "../components/LiveAiTimeline";
import type { CameraSource } from "../api/camera-feeds.types";
import "../styles/live-monitoring.css";

/* ── Inline SVG icons — no lucide-react ────────────────────────────────── */
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
function IconGrid9() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3"  width="5" height="5" rx="0.5"/><rect x="9.5" y="3"  width="5" height="5" rx="0.5"/><rect x="16" y="3"  width="5" height="5" rx="0.5"/>
      <rect x="3" y="9.5" width="5" height="5" rx="0.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.5"/><rect x="16" y="9.5" width="5" height="5" rx="0.5"/>
      <rect x="3" y="16" width="5" height="5" rx="0.5"/><rect x="9.5" y="16" width="5" height="5" rx="0.5"/><rect x="16" y="16" width="5" height="5" rx="0.5"/>
    </svg>
  );
}
function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5"/><line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5"/><line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5"/>
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
      style={{ transition: "transform 0.5s", transform: spinning ? "rotate(360deg)" : "none", animation: spinning ? "lm-spin 0.8s linear infinite" : "none" }}
    >
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  );
}

const LAYOUTS: { value: GridLayout; Icon: React.ComponentType; label: string }[] = [
  { value: 1, Icon: IconGrid1, label: "1 camera" },
  { value: 2, Icon: IconGrid2, label: "2 cameras" },
  { value: 4, Icon: IconGrid4, label: "4 cameras" },
  { value: 9, Icon: IconGrid9, label: "9 cameras" },
];

/**
 * Live Monitoring — real-time camera wall.
 *
 * Uses real useCameraFeeds data (polls every 5 s) and useAuthenticatedImage
 * for private frame URLs. Mock panels (Quick Incidents, AI Timeline) are
 * explicitly labeled SIMULATED in the UI.
 */
export default function LiveMonitoringPage() {
  const [site, setSite] = useState("");
  const [layout, setLayout] = useState<GridLayout>(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const query = useCameraFeeds({ site });
  const sources = useMemo(() => query.data?.data ?? [], [query.data]);

  // Unique sites for site filter (derived from loaded page)
  const siteOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const s of sources) {
      if (s.site) seen.add(s.site);
    }
    return Array.from(seen);
  }, [sources]);

  const selectedSource: CameraSource | null =
    selectedId ? (sources.find((s) => s.id === selectedId) ?? null) : null;

  const handleSelect = (source: CameraSource) => {
    setSelectedId((prev) => (prev === source.id ? null : source.id));
  };

  const handleFullscreen = (source: CameraSource) => {
    // Fallback when tile's own requestFullscreen isn't available
    setSelectedId(source.id);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void query.refetch().finally(() => {
      setTimeout(() => setRefreshing(false), 800);
    });
  };

  // The indicator is "connected" if the last query succeeded (data is present)
  const isLive = !query.isError && !query.isLoading && Boolean(query.data);

  return (
    <>
      <PageMeta
        title="Live Monitoring | Sentrix Console"
        description="Real-time camera feeds across your sites"
      />

      {/* Toolbar — breadcrumb + controls in one row */}
      <div className="lm-toolbar">
        <div className="lm-toolbar-left">
          {/* Breadcrumb-style title (same visual weight as other pages) */}
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

          {/* Camera browser toggle */}
          <button
            className={`lm-layout-btn${showBrowser ? " active" : ""}`}
            onClick={() => setShowBrowser((v) => !v)}
            title="Camera browser"
            aria-pressed={showBrowser}
            aria-label="Toggle camera browser"
          >
            <IconList />
          </button>

          {/* Layout selectors */}
          {LAYOUTS.map(({ value, Icon, label }) => (
            <button
              key={value}
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
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh camera feeds"
          >
            <IconRefresh spinning={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main workspace — camera grid + right rail */}
      <div className="lm-workspace">
        {/* Left: camera grid area with optional browser overlay */}
        <div className="lm-browser-wrap">
          {showBrowser && (
            <LiveCameraBrowser
              sources={sources}
              selectedId={selectedId}
              onSelect={handleSelect}
              onClose={() => setShowBrowser(false)}
            />
          )}
          <LiveCameraGrid
            sources={sources}
            layout={layout}
            selectedId={selectedId}
            onSelect={handleSelect}
            onFullscreen={handleFullscreen}
            showBrowser={showBrowser}
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
          />
          {/* AI Detection Timeline — SIMULATED — constrained to camera-grid column width */}
          <LiveAiTimeline />
        </div>

        {/* Right rail */}
        <div className="lm-right-rail">
          {/* Selected camera details (real API data) */}
          <LiveCameraDetails source={selectedSource} />

          {/* Quick Incidents — SIMULATED, labeled in UI */}
          <LiveQuickIncidents />
        </div>
      </div>

    </>
  );
}
