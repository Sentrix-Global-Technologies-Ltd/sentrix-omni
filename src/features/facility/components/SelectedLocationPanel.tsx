import { useState, useRef, useEffect } from "react";
import type React from "react";
import Can from "../../../components/shared/Can";
import ConfirmActionButton from "../../../components/shared/ConfirmActionButton";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import { useToast } from "../../../components/shared/toast";
import { useFacilityActions } from "../hooks/useFacilityMap";
import { ApiError } from "../../../services/api/errors";
import type { FacilityBuilding, FacilityZone, FacilityCameraPin } from "../api/facility.types";

// ── Inline icons ─────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14"/>
      <rect x="1" y="6" width="14" height="12" rx="2"/>
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

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ── Feed status helpers ───────────────────────────────────────────────────────

function feedStatusLabel(status: FacilityCameraPin["feed_status"]): string {
  switch (status) {
    case "live":     return "Live";
    case "stale":    return "Stale";
    case "offline":  return "Offline";
    case "no_feed":  return "No Feed";
    default:         return String(status);
  }
}

function feedStatusStyle(status: FacilityCameraPin["feed_status"]): React.CSSProperties {
  switch (status) {
    case "live":
      return { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#0f766e", background: "#ccfbf1", borderRadius: "999px", padding: "0.125rem 0.5rem" };
    case "stale":
      return { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#b45309", background: "#fef3c7", borderRadius: "999px", padding: "0.125rem 0.5rem" };
    default:
      return { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", background: "#f1f5f9", borderRadius: "999px", padding: "0.125rem 0.5rem" };
  }
}

// ── Inline name editor ───────────────────────────────────────────────────────

interface InlineEditProps {
  value: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  testId?: string;
}

function InlineNameEdit({ value, onSubmit, onCancel, testId }: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSubmit(trimmed);
    else onCancel();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
      <input
        ref={inputRef}
        data-testid={testId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") onCancel(); }}
        style={{
          flex: 1, height: "1.75rem", padding: "0 0.375rem", fontSize: "0.8125rem",
          fontWeight: 600, color: "inherit", background: "transparent",
          border: "1px solid #94a3b8", borderRadius: "0.375rem", outline: "none",
        }}
      />
      <button
        data-testid={testId ? `${testId}-save` : undefined}
        onClick={commit}
        disabled={!draft.trim()}
        style={{ display:"flex", alignItems:"center", padding:"0.25rem", borderRadius:"0.25rem", color:"#0f766e", cursor:"pointer", background:"transparent", border:"none" }}
        aria-label="Save"
      >
        <CheckIcon />
      </button>
      <button
        onClick={onCancel}
        style={{ display:"flex", alignItems:"center", padding:"0.25rem", borderRadius:"0.25rem", color:"#6b7280", cursor:"pointer", background:"transparent", border:"none" }}
        aria-label="Cancel"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selectedCameraId: string | null;
  selectedBuildingId: string | null;
  buildings: FacilityBuilding[];
  /** Called when user clicks Add Zone — page manages the modal */
  onAddZone: (building: FacilityBuilding) => void;
}

interface ResolvedCamera {
  camera: FacilityCameraPin;
  zone: FacilityZone | null;
  building: FacilityBuilding;
}

function resolveCamera(cameraId: string, buildings: FacilityBuilding[]): ResolvedCamera | null {
  for (const building of buildings) {
    for (const zone of building.zones) {
      const cam = zone.cameras.find((c) => c.id === cameraId);
      if (cam) return { camera: cam, zone, building };
    }
  }
  return null;
}

export default function SelectedLocationPanel({ selectedCameraId, selectedBuildingId, buildings, onAddZone }: Props) {
  const toast = useToast();
  const { updateBuilding, deleteBuilding, updateZone, deleteZone } = useFacilityActions();

  // ── Building rename state ────────────────────────────────────────
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [buildingRenameConfirm, setBuildingRenameConfirm] = useState<{ building: FacilityBuilding; newName: string } | null>(null);

  // ── Zone rename state ────────────────────────────────────────────
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneRenameConfirm, setZoneRenameConfirm] = useState<{ building: FacilityBuilding; zone: FacilityZone; newName: string } | null>(null);

  // ── Resolve selections ───────────────────────────────────────────
  const resolvedCamera: ResolvedCamera | null = selectedCameraId
    ? resolveCamera(selectedCameraId, buildings)
    : null;

  const resolvedBuilding: FacilityBuilding | null = selectedBuildingId
    ? buildings.find((b) => b.id === selectedBuildingId) ?? null
    : null;

  const hasSelection = resolvedCamera !== null || resolvedBuilding !== null;

  // ── Building rename handlers ─────────────────────────────────────
  const submitBuildingRename = async (building: FacilityBuilding, newName: string) => {
    const totalCams = building.zones.reduce((s, z) => s + z.cameras_total, 0) + building.unzoned_cameras_total;
    if (totalCams > 0) {
      // Warn before renaming — cameras are matched by site name
      setBuildingRenameConfirm({ building, newName });
      return;
    }
    await doRenameBuilding(building.id, newName);
  };

  const doRenameBuilding = async (buildingId: string, newName: string) => {
    try {
      await updateBuilding.mutateAsync({ buildingId, payload: { name: newName } });
      toast.success(`Building renamed to "${newName}".`);
      setEditingBuildingId(null);
      setBuildingRenameConfirm(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename building.");
    }
  };

  // ── Zone rename handlers ─────────────────────────────────────────
  const submitZoneRename = async (building: FacilityBuilding, zone: FacilityZone, newName: string) => {
    if (zone.cameras_total > 0) {
      setZoneRenameConfirm({ building, zone, newName });
      return;
    }
    await doRenameZone(building.id, zone.id, newName);
  };

  const doRenameZone = async (buildingId: string, zoneId: string, newName: string) => {
    try {
      await updateZone.mutateAsync({ buildingId, zoneId, payload: { name: newName } });
      toast.success(`Zone renamed to "${newName}".`);
      setEditingZoneId(null);
      setZoneRenameConfirm(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename zone.");
    }
  };

  return (
    <div className="fm-panel">
      <div className="fm-location-hd">Selected Location</div>

      {!hasSelection ? (
        <div className="fm-location-empty">
          Click a camera or building on the map to view details here.
        </div>
      ) : resolvedCamera ? (
        /* ── Camera selected ── */
        (() => {
          const { camera, zone, building } = resolvedCamera;
          const status = camera.feed_status;
          return (
            <>
              <div className="fm-location-cam-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="fm-location-cam-icon"><CameraIcon /></div>
                  <div>
                    <div className="fm-location-cam-label">{camera.label}</div>
                    <div className="fm-location-cam-id">Camera · {building.name}</div>
                  </div>
                </div>
                <span style={feedStatusStyle(status)}>
                  {status === "live" && <span className="fm-location-status-dot" />}
                  {feedStatusLabel(status)}
                </span>
              </div>

              <div className={`fm-location-preview${status === "live" ? " fm-location-preview--live" : ""}`}>
                <div className="fm-location-preview-placeholder">
                  <VideoOffIcon />
                  <span style={{ fontSize: "0.6875rem" }}>Feed preview not available</span>
                </div>
                {status === "live" && (
                  <div className="fm-location-preview-live-pill">
                    <span className="fm-location-preview-live-dot" />
                    Live
                  </div>
                )}
              </div>

              <div className="fm-location-details">
                <div className="fm-location-detail-hd">Camera Details</div>
                {[
                  { key: "Building",  val: building.name },
                  { key: "Zone",      val: zone?.name ?? "Unzoned" },
                  { key: "Type",      val: camera.type },
                  { key: "Feed",      val: feedStatusLabel(status) },
                ].map((row) => (
                  <div key={row.key} className="fm-detail-row">
                    <span className="fm-detail-key">{row.key}</span>
                    <span className="fm-detail-val">{row.val}</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()
      ) : resolvedBuilding ? (
        /* ── Building selected ── */
        (() => {
          const b = resolvedBuilding;
          const totalCams = b.zones.reduce((s, z) => s + z.cameras_total, 0) + b.unzoned_cameras_total;
          const onlineCams = b.zones.reduce((s, z) => s + z.cameras_online, 0);
          const isEditingBuilding = editingBuildingId === b.id;

          return (
            <>
              {/* Header row */}
              <div className="fm-location-cam-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                  <div className="fm-location-cam-icon"><BuildingIcon /></div>
                  {isEditingBuilding ? (
                    <InlineNameEdit
                      testId="building-name-input"
                      value={b.name}
                      onSubmit={(name) => void submitBuildingRename(b, name)}
                      onCancel={() => setEditingBuildingId(null)}
                    />
                  ) : (
                    <div style={{ minWidth: 0 }}>
                      <div className="fm-location-cam-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                        <Can permission="hardware.register">
                          <button
                            data-testid="rename-building-btn"
                            onClick={() => setEditingBuildingId(b.id)}
                            style={{ flexShrink: 0, display: "flex", padding: "0.125rem", borderRadius: "0.25rem", color: "#94a3b8", cursor: "pointer", background: "transparent", border: "none" }}
                            aria-label={`Rename ${b.name}`}
                          >
                            <PencilIcon />
                          </button>
                        </Can>
                      </div>
                      <div className="fm-location-cam-id">{totalCams} camera{totalCams !== 1 ? "s" : ""} · {b.zones.length} zone{b.zones.length !== 1 ? "s" : ""}</div>
                    </div>
                  )}
                </div>
                {!isEditingBuilding && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600, color: "#0f766e", background: "#ccfbf1", borderRadius: "999px", padding: "0.125rem 0.5rem" }}>
                    <span className="fm-location-status-dot" />
                    Active
                  </span>
                )}
              </div>

              {/* Zone preview art */}
              <div className="fm-location-preview fm-location-preview--live"
                style={{ background: "#0f1f30", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg viewBox="0 0 200 112" width="100%" height="100%" style={{ display: "block" }}>
                  <rect width="200" height="112" fill="#0f1f30"/>
                  <rect x="60" y="40" width="80" height="55" fill="#1e3248"/>
                  <rect x="70" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
                  <rect x="95" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
                  <rect x="120" y="50" width="15" height="15" fill="#14b8a6" opacity="0.3"/>
                  <rect x="80" y="75" width="20" height="20" fill="#2dd4bf" opacity="0.2"/>
                  <text x="100" y="23" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                    {b.name}
                  </text>
                </svg>
              </div>

              {/* Building details */}
              <div className="fm-location-details">
                <div className="fm-location-detail-hd">Building Details</div>
                {[
                  { key: "Zones",           val: String(b.zones.length) },
                  { key: "Total Cameras",   val: String(totalCams) },
                  { key: "Online",          val: String(onlineCams) },
                  { key: "Unzoned Cameras", val: String(b.unzoned_cameras_total) },
                ].map((row) => (
                  <div key={row.key} className="fm-detail-row">
                    <span className="fm-detail-key">{row.key}</span>
                    <span className="fm-detail-val">{row.val}</span>
                  </div>
                ))}
              </div>

              {/* Zone management (hardware.register only) */}
              <Can permission="hardware.register">
                <div className="fm-location-details" style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <div className="fm-location-detail-hd" style={{ marginBottom: 0 }}>Zones</div>
                    <button
                      data-testid="add-zone-btn"
                      onClick={() => onAddZone(b)}
                      style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", fontWeight: 600, color: "#0f766e", cursor: "pointer", background: "transparent", border: "none", padding: "0.125rem 0.375rem", borderRadius: "0.375rem" }}
                    >
                      <PlusIcon /> Add Zone
                    </button>
                  </div>

                  {b.zones.length === 0 ? (
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", padding: "0.375rem 0" }}>
                      No zones yet — add one to map camera positions.
                    </div>
                  ) : (
                    b.zones.map((zone) => {
                      const isEditingZone = editingZoneId === zone.id;
                      return (
                        <div key={zone.id} className="fm-detail-row" style={{ alignItems: "center", minHeight: "2rem" }}>
                          {isEditingZone ? (
                            <InlineNameEdit
                              testId={`zone-name-input-${zone.id}`}
                              value={zone.name}
                              onSubmit={(name) => void submitZoneRename(b, zone, name)}
                              onCancel={() => setEditingZoneId(null)}
                            />
                          ) : (
                            <>
                              <span className="fm-detail-key" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                {zone.name}
                                <button
                                  data-testid={`rename-zone-btn-${zone.id}`}
                                  onClick={() => setEditingZoneId(zone.id)}
                                  style={{ display: "flex", padding: "0.125rem", borderRadius: "0.25rem", color: "#94a3b8", cursor: "pointer", background: "transparent", border: "none" }}
                                  aria-label={`Rename zone ${zone.name}`}
                                >
                                  <PencilIcon />
                                </button>
                              </span>
                              <span className="fm-detail-val" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                                  {zone.cameras_total} cam{zone.cameras_total !== 1 ? "s" : ""}
                                </span>
                                <ConfirmActionButton
                                  label="Delete"
                                  tone="danger"
                                  triggerVariant="outline"
                                  triggerSize="sm"
                                  title={`Delete zone "${zone.name}"?`}
                                  description={
                                    zone.cameras_total > 0
                                      ? `This zone has ${zone.cameras_total} matched camera${zone.cameras_total !== 1 ? "s" : ""}. Deleting the zone removes the mapping — cameras remain registered in Hardware → Cameras but will appear unzoned.`
                                      : `Zone "${zone.name}" will be permanently removed from this building.`
                                  }
                                  confirmLabel="Delete zone"
                                  successMessage={`Zone "${zone.name}" deleted.`}
                                  onConfirm={() => deleteZone.mutateAsync({ buildingId: b.id, zoneId: zone.id })}
                                />
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Delete building — separate from zone list */}
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-start", paddingLeft: "1rem", paddingBottom: "0.75rem" }}>
                  <ConfirmActionButton
                    label="Delete Building"
                    tone="danger"
                    triggerVariant="outline"
                    triggerSize="sm"
                    title={`Delete "${b.name}"?`}
                    description={
                      b.zones.length > 0
                        ? `This will permanently delete "${b.name}" and all ${b.zones.length} of its zone${b.zones.length !== 1 ? "s" : ""}${totalCams > 0 ? ` (${totalCams} camera${totalCams !== 1 ? "s" : ""} will become unmatched — they remain in Hardware → Cameras)` : ""}. Detection event history is not affected.`
                        : `"${b.name}" will be permanently removed from the map.${totalCams > 0 ? ` ${totalCams} camera${totalCams !== 1 ? "s" : ""} will become unmatched but remain registered in Hardware → Cameras.` : ""} Detection event history is not affected.`
                    }
                    confirmLabel="Delete building"
                    successMessage={`${b.name} removed.`}
                    onConfirm={() => deleteBuilding.mutateAsync(b.id)}
                  />
                </div>
              </Can>

              {/* Building rename confirm (when cameras are affected) */}
              <ConfirmDialog
                open={buildingRenameConfirm !== null}
                onClose={() => { setBuildingRenameConfirm(null); setEditingBuildingId(null); }}
                title="Rename building?"
                description={
                  buildingRenameConfirm
                    ? `Renaming "${buildingRenameConfirm.building.name}" to "${buildingRenameConfirm.newName}" will break the name-based match for ${
                        buildingRenameConfirm.building.zones.reduce((s, z) => s + z.cameras_total, 0) + buildingRenameConfirm.building.unzoned_cameras_total
                      } camera${(buildingRenameConfirm.building.zones.reduce((s, z) => s + z.cameras_total, 0) + buildingRenameConfirm.building.unzoned_cameras_total) !== 1 ? "s" : ""} until you update their Site name in Hardware → Cameras.`
                    : undefined
                }
                confirmLabel="Rename anyway"
                tone="primary"
                loading={updateBuilding.isPending}
                onConfirm={() => {
                  if (buildingRenameConfirm) {
                    void doRenameBuilding(buildingRenameConfirm.building.id, buildingRenameConfirm.newName);
                  }
                }}
              />

              {/* Zone rename confirm (when cameras are affected) */}
              <ConfirmDialog
                open={zoneRenameConfirm !== null}
                onClose={() => { setZoneRenameConfirm(null); setEditingZoneId(null); }}
                title="Rename zone?"
                description={
                  zoneRenameConfirm
                    ? `Renaming "${zoneRenameConfirm.zone.name}" to "${zoneRenameConfirm.newName}" will break the name-based match for ${zoneRenameConfirm.zone.cameras_total} camera${zoneRenameConfirm.zone.cameras_total !== 1 ? "s" : ""} until you update their Zone name in Hardware → Cameras.`
                    : undefined
                }
                confirmLabel="Rename anyway"
                tone="primary"
                loading={updateZone.isPending}
                onConfirm={() => {
                  if (zoneRenameConfirm) {
                    void doRenameZone(zoneRenameConfirm.building.id, zoneRenameConfirm.zone.id, zoneRenameConfirm.newName);
                  }
                }}
              />
            </>
          );
        })()
      ) : null}
    </div>
  );
}
