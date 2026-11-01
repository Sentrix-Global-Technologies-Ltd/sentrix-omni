import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useAuthz } from "../../../hooks/useAuthz";
import { useFacilityMap, useFacilityActions, useOrgCameraSources } from "../hooks/useFacilityMap";
import AddBuildingModal from "../components/AddBuildingModal";
import AddZoneModal from "../components/AddZoneModal";
import MapControlsPanel from "../components/MapControlsPanel";
import FacilityMapCampus from "../components/FacilityMapCampus";
import FacilityZoneEvents from "../components/FacilityZoneEvents";
import SelectedLocationPanel from "../components/SelectedLocationPanel";
import FacilityMapLegend from "../components/FacilityMapLegend";
import type { FacilityBuilding } from "../api/facility.types";
import type { DrawRect } from "../components/AddBuildingModal";
import type { GhostRect } from "../hooks/useConfigDrag";
import type { LayerKey } from "../data/facilityMockData";
import "../styles/facility-map.css";

export default function FacilityMapPage() {
  /* ── real backend data ───────────────────────────────────────────── */
  const query = useFacilityMap();
  const { updateBuilding, updateZone, placeCameraOnMap } = useFacilityActions();
  // Fetch all org camera sources independently so cameras without a matching
  // site/zone appear in the Unplaced Cameras panel (see collectUnplacedCameras).
  const allOrgCamerasQuery = useOrgCameraSources();

  /* ── modal state ─────────────────────────────────────────────────── */
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addZoneFor, setAddZoneFor] = useState<FacilityBuilding | null>(null);
  const [configMode, setConfigMode] = useState(false);

  /* ── permission guards ──────────────────────────────────────────── */
  const { isAllowed } = useAuthz();
  /** True only when the principal holds BOTH bridges.manage AND hardware.register.
   * bridges.manage = can update camera sources (backend gate on placement + delete)
   * hardware.register = can create/update buildings and zones (backend gate on saves)
   * Config mode must not be entered without both, because Save is always gated on
   * hardware.register and placement is gated on bridges.manage. */
  const canManageConfig =
    isAllowed({ anyPermission: ['bridges.manage'] }) &&
    isAllowed({ anyPermission: ['hardware.register'] });

  // Exit Config Mode automatically if the principal loses the required permissions
  // (e.g. role change mid-session reflected via a context refresh).
  // Runs after render so state can settle — follows the existing pattern used for
  // clearing editDraft when configMode becomes false.
  useEffect(() => {
    if (configMode && !canManageConfig) {
      setConfigMode(false);
    }
  }, [configMode, canManageConfig]);

  /** Coordinates captured from the most recent draw gesture; drives modal prefill. */
  const [drawnRect, setDrawnRect] = useState<DrawRect | null>(null);
  /** Draft geometry for the building being moved/resized in config mode. */
  const [editDraft, setEditDraft] = useState<{
    buildingId: string;
    rect: GhostRect;
    original: GhostRect;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  /** Draft geometry for the zone being moved/resized in config mode. */
  const [zoneEditDraft, setZoneEditDraft] = useState<{
    buildingId: string;
    zoneId: string;
    rect: GhostRect;
    original: GhostRect;
  } | null>(null);
  const [zoneEditError, setZoneEditError] = useState<string | null>(null);
  const [zoneEditSaving, setZoneEditSaving] = useState(false);
  /** Error shown when a camera-placement PATCH fails, so the user can retry. */
  const [placeCameraError, setPlaceCameraError] = useState<string | null>(null);
  /** Geometry captured from a zone draw gesture; prefills AddZoneModal. */
  const [drawnZoneRect, setDrawnZoneRect] = useState<GhostRect | null>(null);

  /* ── map state ───────────────────────────────────────────────────── */
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    cameras: true,
    zones: true,
    alerts: true,
    "access-points": true,
    sensors: false,
    perimeter: true,
    "building-labels": true,
  });
  const [zoneFilter, setZoneFilter] = useState("all");
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  /* ── derived data ────────────────────────────────────────────────── */
  const buildings = query.data?.data.buildings ?? [];
  const events    = query.data?.data.recent_events ?? [];

  const zoneFilterOptions = [
    { value: "all", label: "All Zones" },
    ...buildings.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Camera counts derived from API aggregates (no double-counting).
  // online  = sum of zones[].cameras_online across all buildings
  // total   = sum of zones[].cameras_total + unzoned_cameras_total per building
  // offline = total − online  (covers stale/offline/no_feed feeds)
  const cameraOnline  = buildings.reduce((s, b) => s + b.zones.reduce((zs, z) => zs + z.cameras_online, 0), 0);
  const cameraTotal   = buildings.reduce((s, b) => s + b.zones.reduce((zs, z) => zs + z.cameras_total, 0) + b.unzoned_cameras_total, 0);
  const cameraOffline = Math.max(0, cameraTotal - cameraOnline);
  const cameraCounts  = { online: cameraOnline, offline: cameraOffline, total: cameraTotal };

  /* ── helpers ─────────────────────────────────────────────────────── */
  const toggleLayer = (key: LayerKey) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  /**
   * Fired by FacilityMapCampus when the user completes a draw gesture.
   * Stores the rect and opens AddBuildingModal with pre-filled coordinates.
   */
  const handleDrawComplete = (rect: GhostRect) => {
    setDrawnRect(rect);
    setAddBuildingOpen(true);
  };

  /** Called when the user clicks a building in configMode to select it for editing. */
  const handleEditSelect = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedCameraId(null);
    // Clear zone draft when switching to a different building.
    if (!editDraft || editDraft.buildingId !== buildingId) {
      setZoneEditDraft(null);
      setZoneEditError(null);
    }
    // Only initialise building draft when switching to a different building.
    if (!editDraft || editDraft.buildingId !== buildingId) {
      const b = buildings.find((bld) => bld.id === buildingId);
      if (!b) return;
      const rect: GhostRect = { x: b.x, y: b.y, width: b.width, height: b.height };
      setEditDraft({ buildingId, rect, original: rect });
      setEditError(null);
    }
  };

  /** Called when a move drag completes. Updates the local draft. */
  const handleMoveComplete = (buildingId: string, rect: GhostRect) => {
    setEditDraft((prev) =>
      prev
        ? { ...prev, rect }
        : { buildingId, rect, original: rect },
    );
    setEditError(null);
  };

  /** Called when a resize drag completes. Updates the local draft. */
  const handleResizeComplete = (buildingId: string, rect: GhostRect) => {
    setEditDraft((prev) =>
      prev
        ? { ...prev, rect }
        : { buildingId, rect, original: rect },
    );
    setEditError(null);
  };

  /** Save the draft geometry to the backend. */
  const handleEditSave = async () => {
    if (!editDraft) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateBuilding.mutateAsync({
        buildingId: editDraft.buildingId,
        payload: {
          x:      editDraft.rect.x,
          y:      editDraft.rect.y,
          width:  editDraft.rect.width,
          height: editDraft.rect.height,
        },
      });
      setEditDraft(null);
    } catch {
      setEditError("Failed to save — check your connection and try again.");
    } finally {
      setEditSaving(false);
    }
  };

  /** Discard the draft and restore to the last persisted geometry. */
  const handleEditCancel = () => {
    setEditDraft(null);
    setEditError(null);
  };

  // ── Zone editing handlers (Batch 2-E) ────────────────────────────────────

  /**
   * Fired by FacilityMapCampus when the user completes a zone draw gesture.
   * Opens AddZoneModal pre-filled with the drawn zone-pct rect.
   */
  const handleZoneDrawComplete = (buildingId: string, rect: GhostRect) => {
    const building = buildings.find((b) => b.id === buildingId);
    if (!building) return;
    setDrawnZoneRect(rect);
    setAddZoneFor(building);
  };

  /** Called when the user clicks a zone in configMode to select it for editing. */
  const handleZoneEditSelect = (buildingId: string, zoneId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    const zone = building?.zones.find((z) => z.id === zoneId);
    if (!zone) return;
    if (zoneEditDraft?.zoneId === zoneId) return;
    const rect: GhostRect = { x: zone.x, y: zone.y, width: zone.width, height: zone.height };
    setZoneEditDraft({ buildingId, zoneId, rect, original: rect });
    setZoneEditError(null);
  };

  /** Called when a zone move drag completes. Updates the local zone draft. */
  const handleZoneMoveComplete = (buildingId: string, zoneId: string, rect: GhostRect) => {
    setZoneEditDraft((prev) =>
      prev ? { ...prev, rect } : { buildingId, zoneId, rect, original: rect },
    );
    setZoneEditError(null);
  };

  /** Called when a zone resize drag completes. Updates the local zone draft. */
  const handleZoneResizeComplete = (buildingId: string, zoneId: string, rect: GhostRect) => {
    setZoneEditDraft((prev) =>
      prev ? { ...prev, rect } : { buildingId, zoneId, rect, original: rect },
    );
    setZoneEditError(null);
  };

  /**
   * Invoked when the user drops an unplaced camera onto a building in the map.
   * PATCHes map_x / map_y AND site / zone via the vision-guard endpoint so the
   * camera persists its building/zone association and reappears after a page
   * refresh (FacilityMapController matches cameras to buildings by site name).
   */
  const handlePlaceCamera = (
    cameraId: string,
    _buildingId: string,
    mapX: number,
    mapY: number,
    buildingName: string,
    zoneName: string | null,
  ) => {
    setPlaceCameraError(null);
    placeCameraOnMap
      .mutateAsync({
        cameraId,
        payload: {
          map_x: mapX,
          map_y: mapY,
          site: buildingName,
          ...(zoneName !== null ? { zone: zoneName } : {}),
        },
      })
      .catch((err: unknown) => {
        console.error("[FacilityMap] Failed to place camera:", err);
        setPlaceCameraError(
          "Could not save camera position — check your connection and drag it again to retry.",
        );
      });
  };

  /** Save the zone draft geometry to the backend. */
  const handleZoneEditSave = async () => {
    if (!zoneEditDraft) return;
    setZoneEditSaving(true);
    setZoneEditError(null);
    try {
      await updateZone.mutateAsync({
        buildingId: zoneEditDraft.buildingId,
        zoneId: zoneEditDraft.zoneId,
        payload: {
          x:      zoneEditDraft.rect.x,
          y:      zoneEditDraft.rect.y,
          width:  zoneEditDraft.rect.width,
          height: zoneEditDraft.rect.height,
        },
      });
      setZoneEditDraft(null);
    } catch {
      setZoneEditError("Failed to save zone — check your connection and try again.");
    } finally {
      setZoneEditSaving(false);
    }
  };

  /** Discard the zone draft and restore the last persisted geometry. */
  const handleZoneEditCancel = () => {
    setZoneEditDraft(null);
    setZoneEditError(null);
  };

  // Clear edit drafts whenever the user exits config mode.
  useEffect(() => {
    if (!configMode) {
      setEditDraft(null);
      setEditError(null);
      setZoneEditDraft(null);
      setZoneEditError(null);
    }
  }, [configMode]);

  const handleSelectCamera = (id: string) => {
    setSelectedCameraId(id);
    setSelectedBuildingId(null);
  };
  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedCameraId(null);
  };

  return (
    <>
      <PageMeta
        title="Facility Map | Sentrix Console"
        description="Real-time view of your sites, cameras and zones"
      />

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="fm-custom-hd">
        {/* Left: title + description */}
        <div className="fm-custom-hd-left">
          <h1 className="fm-custom-hd-title">Facility Map</h1>
        </div>

        {/* Right: breadcrumb · All Sites · Add Building */}
        <div className="fm-custom-hd-controls">

          {/* All Sites filter */}
          <div className="fm-hd-filter-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            <span>All Sites</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Edit Map toggle — requires BOTH bridges.manage (camera ops) AND
               hardware.register (building/zone saves) so a principal without
               either cannot enter a mode where they cannot persist changes. */}
          {canManageConfig && (
            <Button
              size="sm"
              variant={configMode ? "outline" : "outline"}
              onClick={() => setConfigMode((v) => !v)}
            >
              {configMode ? "Exit Config" : "Edit Map"}
            </Button>
          )}

          {/* Add Building */}
          <Can permission="hardware.register">
            <Button size="sm" variant="primary" onClick={() => setAddBuildingOpen(true)}>
              Add Building
            </Button>
          </Can>

          {/* Backend sync indicator */}
          {query.isLoading && (
            <span title="Syncing…" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
          )}
          {query.error && (
            <span title="Backend unavailable — showing stale data" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* ── 3-column workspace ───────────────────────────────────────── */}
      <div className="fm-workspace">
        {/* Left: Map Controls */}
        <MapControlsPanel
          layers={layers}
          onToggleLayer={toggleLayer}
          zoneFilter={zoneFilter}
          onZoneFilter={setZoneFilter}
          zoneFilterOptions={zoneFilterOptions}
          cameraCounts={cameraCounts}
        />

        {/* Centre: SVG Campus Map */}
        <div style={{ minWidth: 0 }}>
          {/* ── Zone edit save/cancel bar ───────────────────────────────── */}
          {configMode && zoneEditDraft && (
            <div className="fm-edit-save-bar" role="status" aria-label="Unsaved zone changes" data-testid="zone-edit-save-bar">
              <span className="fm-edit-save-info">
                {zoneEditError ? (
                  <span className="fm-edit-error">{zoneEditError}</span>
                ) : (
                  <>
                    Editing zone in{" "}
                    <strong>
                      {buildings.find((b) => b.id === zoneEditDraft.buildingId)?.name ?? "Building"}
                    </strong>
                    {" — unsaved changes"}
                  </>
                )}
              </span>
              <div className="fm-edit-save-actions">
                <button
                  className="fm-edit-cancel-btn"
                  onClick={handleZoneEditCancel}
                  disabled={zoneEditSaving}
                >
                  Cancel
                </button>
                {zoneEditError ? (
                  <button
                    className="fm-edit-save-btn"
                    onClick={() => void handleZoneEditSave()}
                    disabled={zoneEditSaving}
                  >
                    {zoneEditSaving ? "Saving…" : "Retry"}
                  </button>
                ) : (
                  <Can permission="hardware.register">
                    <button
                      className="fm-edit-save-btn"
                      onClick={() => void handleZoneEditSave()}
                      disabled={zoneEditSaving}
                    >
                      {zoneEditSaving ? "Saving…" : "Save Zone"}
                    </button>
                  </Can>
                )}
              </div>
            </div>
          )}
          {/* ── Edit draft save/cancel bar ─────────────────────────────── */}
          {configMode && editDraft && (
            <div className="fm-edit-save-bar" role="status" aria-label="Unsaved building changes">
              <span className="fm-edit-save-info">
                {editError ? (
                  <span className="fm-edit-error">{editError}</span>
                ) : (
                  <>
                    Editing{" "}
                    <strong>
                      {buildings.find((b) => b.id === editDraft.buildingId)?.name ?? "Building"}
                    </strong>
                    {" — unsaved changes"}
                  </>
                )}
              </span>
              <div className="fm-edit-save-actions">
                <button
                  className="fm-edit-cancel-btn"
                  onClick={handleEditCancel}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                {editError ? (
                  <button
                    className="fm-edit-save-btn"
                    onClick={() => void handleEditSave()}
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving…" : "Retry"}
                  </button>
                ) : (
                  <Can permission="hardware.register">
                    <button
                      className="fm-edit-save-btn"
                      onClick={() => void handleEditSave()}
                      disabled={editSaving}
                    >
                      {editSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </Can>
                )}
              </div>
            </div>
          )}
          {placeCameraError && (
            <div
              className="fm-place-error"
              role="alert"
              aria-live="assertive"
            >
              <span>{placeCameraError}</span>
              <button
                className="fm-place-error-dismiss"
                aria-label="Dismiss"
                onClick={() => setPlaceCameraError(null)}
              >
                ✕
              </button>
            </div>
          )}
          <FacilityMapCampus
            buildings={buildings}
            allOrgCameras={allOrgCamerasQuery.data?.data ?? []}
            isLoading={query.isLoading && !query.data}
            isError={query.isError && !query.data}
            onRetry={() => void query.refetch()}
            layers={layers}
            zoneFilter={zoneFilter}
            selectedCameraId={selectedCameraId}
            selectedBuildingId={selectedBuildingId}
            onSelectCamera={handleSelectCamera}
            onSelectBuilding={handleSelectBuilding}
            configMode={configMode}
            onDrawComplete={handleDrawComplete}
            editingBuildingId={editDraft?.buildingId ?? null}
            editDraftRect={editDraft?.rect ?? null}
            onEditSelect={handleEditSelect}
            onMoveComplete={handleMoveComplete}
            onResizeComplete={handleResizeComplete}
            editingZoneId={zoneEditDraft?.zoneId ?? null}
            editZoneDraftRect={zoneEditDraft?.rect ?? null}
            onZoneEditSelect={handleZoneEditSelect}
            onZoneDrawComplete={handleZoneDrawComplete}
            onZoneMoveComplete={handleZoneMoveComplete}
            onZoneResizeComplete={handleZoneResizeComplete}
            onPlaceCamera={
              isAllowed({ anyPermission: ['bridges.manage'] })
                ? handlePlaceCamera
                : undefined
            }
          />
        </div>

        {/* Right: Events + Selected Location */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <FacilityZoneEvents events={events} buildings={buildings} onSelectBuilding={handleSelectBuilding} />
          <SelectedLocationPanel
            selectedCameraId={selectedCameraId}
            selectedBuildingId={selectedBuildingId}
            buildings={buildings}
            onAddZone={setAddZoneFor}
          />
        </div>
      </div>

      {/* Legend */}
      <FacilityMapLegend />

      {/* Modals */}
      <AddBuildingModal
        open={addBuildingOpen}
        onClose={() => {
          setAddBuildingOpen(false);
          // Discard the draw draft. configMode is intentionally preserved
          // so the user can immediately draw another building without
          // having to re-enter config mode.
          setDrawnRect(null);
        }}
        initialRect={drawnRect ?? undefined}
      />
      <AddZoneModal
        open={addZoneFor !== null}
        onClose={() => {
          setAddZoneFor(null);
          setDrawnZoneRect(null);
        }}
        buildingId={addZoneFor?.id ?? null}
        buildingName={addZoneFor?.name ?? ""}
        initialRect={drawnZoneRect}
        existingZones={addZoneFor?.zones ?? []}
      />
    </>
  );
}
