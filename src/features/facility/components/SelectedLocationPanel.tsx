import { MOCK_CAMERAS, MOCK_BUILDINGS } from "../data/facilityMockData";

// ── Inline icons ─────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14"/>
      <rect x="1" y="6" width="14" height="12" rx="2"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15,3 21,3 21,9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="1"/>
      <path d="M8 6h2M8 10h2M8 14h2M14 6h2M14 10h2M14 14h2M10 22v-4h4v4"/>
    </svg>
  );
}

function VideoOffIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14"/>
      <rect x="1" y="6" width="14" height="12" rx="2"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selectedCameraId: string | null;
  selectedBuildingId: string | null;
}

export default function SelectedLocationPanel({ selectedCameraId, selectedBuildingId }: Props) {
  const camera = selectedCameraId ? MOCK_CAMERAS.find((c) => c.id === selectedCameraId) ?? null : null;
  const building = selectedBuildingId ? MOCK_BUILDINGS.find((b) => b.id === selectedBuildingId) ?? null : null;

  const hasSelection = camera !== null || building !== null;

  return (
    <div className="fm-panel">
      <div className="fm-location-hd">Selected Location</div>

      {!hasSelection ? (
        <div className="fm-location-empty">
          Click a camera or building on the map to view details here.
        </div>
      ) : camera ? (
        /* Camera selected */
        <>
          <div className="fm-location-cam-row">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="fm-location-cam-icon"><CameraIcon /></div>
              <div>
                <div className="fm-location-cam-label">{camera.label}</div>
                <div className="fm-location-cam-id">Camera {camera.cameraId}</div>
              </div>
            </div>
            <div className={camera.status === "online" ? "fm-location-status-online" : undefined}
              style={camera.status !== "online" ? { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: camera.status === "idle" ? "#d97706" : "#6b7280", background: camera.status === "idle" ? "#fffbeb" : "#f1f5f9", borderRadius: "999px", padding: "0.125rem 0.5rem" } : undefined}
            >
              {camera.status === "online" && <span className="fm-location-status-dot" />}
              {camera.status.charAt(0).toUpperCase() + camera.status.slice(1)}
            </div>
          </div>

          {/* Preview placeholder — no real camera stream */}
          <div className={`fm-location-preview${camera.status === "online" ? " fm-location-preview--live" : ""}`}>
            <div className="fm-location-preview-placeholder">
              <VideoOffIcon />
              <span style={{ fontSize: "0.6875rem" }}>Preview unavailable — demo mode</span>
            </div>
            {camera.status === "online" && (
              <div className="fm-location-preview-live-pill">
                <span className="fm-location-preview-live-dot" />
                Live
              </div>
            )}
          </div>

          {/* Details */}
          <div className="fm-location-details">
            <div className="fm-location-detail-hd">Camera Details</div>
            {[
              { key: "Zone", val: camera.zone, valClass: "" },
              { key: "Camera Type", val: camera.type, valClass: "" },
              { key: "Status", val: camera.status === "online" ? "Online" : camera.status === "idle" ? "Idle" : "Offline", valClass: camera.status === "online" ? "fm-detail-val--online" : "" },
              { key: "Resolution", val: camera.resolution, valClass: "" },
            ].map((row) => (
              <div key={row.key} className="fm-detail-row">
                <span className="fm-detail-key">{row.key}</span>
                <span className={`fm-detail-val ${row.valClass}`}>{row.val}</span>
              </div>
            ))}
          </div>

          <div className="fm-location-footer">
            <button className="fm-location-view-btn">
              View Camera Details <ExternalLinkIcon />
            </button>
          </div>
        </>
      ) : building ? (
        /* Building selected */
        <>
          <div className="fm-location-cam-row">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="fm-location-cam-icon"><BuildingIcon /></div>
              <div>
                <div className="fm-location-cam-label">{building.name}</div>
                <div className="fm-location-cam-id">{building.cameraCount} cameras registered</div>
              </div>
            </div>
            <div className="fm-location-status-online">
              <span className="fm-location-status-dot" />
              Active
            </div>
          </div>

          {/* Zone preview placeholder */}
          <div className="fm-location-preview fm-location-preview--live"
            style={{ background: "#0f1f30", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg viewBox="0 0 200 112" width="100%" height="100%" style={{ display: "block" }}>
              <rect width="200" height="112" fill="#0f1f30"/>
              {/* Stylised building silhouette */}
              <rect x="60" y="40" width="80" height="55" fill="#1e3248"/>
              <rect x="70" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
              <rect x="95" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
              <rect x="120" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
              <rect x="80" y="75" width="20" height="20" fill="#2dd4bf" opacity="0.2"/>
              <text x="100" y="23" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                {building.name} — Zone View
              </text>
            </svg>
          </div>

          <div className="fm-location-details">
            <div className="fm-location-detail-hd">Zone Details</div>
            {[
              { key: "Total Cameras", val: String(building.cameraCount) },
              { key: "Zone Status", val: "Active" },
              { key: "Last Scan", val: "Just now" },
              { key: "Coverage", val: "Full perimeter" },
            ].map((row) => (
              <div key={row.key} className="fm-detail-row">
                <span className="fm-detail-key">{row.key}</span>
                <span className={`fm-detail-val ${row.key === "Zone Status" ? "fm-detail-val--online" : ""}`}>{row.val}</span>
              </div>
            ))}
          </div>

          <div className="fm-location-footer">
            <button className="fm-location-view-btn">
              View Zone Details <ExternalLinkIcon />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
