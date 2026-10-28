import type { LayerKey } from "../data/facilityMockData";
import { LAYER_DEFS } from "../data/facilityMockData";

// ── Inline layer icons (no external pkg) ────────────────────────────────────

function LayerIcon({ layerKey }: { layerKey: LayerKey }) {
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (layerKey) {
    case "cameras":
      return <svg {...props}><path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>;
    case "zones":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>;
    case "alerts":
      return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5}/></svg>;
    case "access-points":
      return <svg {...props}><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={2.5}/></svg>;
    case "sensors":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M4.93 4.93a10 10 0 0114.14 0M7.76 7.76a6 6 0 018.49 0M14.12 14.12a4 4 0 01-4.24 0"/></svg>;
    case "perimeter":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 2"/></svg>;
    case "building-labels":
      return <svg {...props}><path d="M4 6h16M4 10h16M4 14h16M4 18h7"/></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="4"/></svg>;
  }
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DragHandle() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="fm-layer-drag">
      {[2, 6, 10].map((y) => (
        <g key={y}>
          <circle cx="3" cy={y} r="1" fill="currentColor"/>
          <circle cx="7" cy={y} r="1" fill="currentColor"/>
        </g>
      ))}
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface CameraCounts {
  online: number;
  offline: number;
  total: number;
}

interface Props {
  layers: Record<LayerKey, boolean>;
  onToggleLayer: (key: LayerKey) => void;
  zoneFilter: string;
  onZoneFilter: (v: string) => void;
  zoneFilterOptions: { value: string; label: string }[];
  cameraCounts: CameraCounts;
}

export default function MapControlsPanel({ layers, onToggleLayer, zoneFilter, onZoneFilter, zoneFilterOptions, cameraCounts }: Props) {
  return (
    <div className="fm-panel">
      <div className="fm-panel-title">Map Controls</div>
      {/* Layers */}
      <div className="fm-panel-section">Layers</div>
      <div className="fm-layers-list">
        {LAYER_DEFS.map((def) => (
          <label key={def.key} className="fm-layer-row">
            <div
              className={`fm-layer-cb${layers[def.key] ? " fm-layer-cb--checked" : ""}`}
              onClick={() => onToggleLayer(def.key)}
            >
              {layers[def.key] && <CheckIcon />}
            </div>
            <span className="fm-layer-icon"><LayerIcon layerKey={def.key} /></span>
            <span className="fm-layer-label">{def.label}</span>
            <DragHandle />
          </label>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-gray-100,#f3f4f6)", margin: "0 0.875rem" }} />

      {/* Zone Filter */}
      <div className="fm-panel-section">Zone Filter</div>
      <div className="fm-zone-filter-wrap">
        <select
          className="fm-zone-select"
          value={zoneFilter}
          onChange={(e) => onZoneFilter(e.target.value)}
        >
          {zoneFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-gray-100,#f3f4f6)", margin: "0 0.875rem" }} />

      {/* Camera Status */}
      <div className="fm-panel-section">Camera Status</div>
      <div className="fm-status-list">
        {([
          { key: "online",  label: "Online",  count: cameraCounts.online },
          { key: "offline", label: "Offline", count: cameraCounts.offline },
        ] as const).map((s) => (
          <div key={s.key} className="fm-status-row">
            <div className="fm-status-left">
              <div className={`fm-status-dot fm-status-dot--${s.key}`} />
              <span className="fm-status-label">{s.label}</span>
            </div>
            <span className="fm-status-count">{s.count}</span>
          </div>
        ))}
        <div className="fm-status-row">
          <div className="fm-status-left">
            <div className="fm-status-dot" style={{ background: "#94a3b8" }} />
            <span className="fm-status-label">Total</span>
          </div>
          <span className="fm-status-count">{cameraCounts.total}</span>
        </div>
      </div>
    </div>
  );
}
