import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import Breadcrumb from "../../../components/shared/Breadcrumb";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { useFacilityMap, useFacilityActions } from "../hooks/useFacilityMap";
import AddBuildingModal from "../components/AddBuildingModal";
import AddZoneModal from "../components/AddZoneModal";
import MapControlsPanel from "../components/MapControlsPanel";
import FacilityMapCampus from "../components/FacilityMapCampus";
import FacilityZoneEvents from "../components/FacilityZoneEvents";
import SelectedLocationPanel from "../components/SelectedLocationPanel";
import FacilityMapLegend from "../components/FacilityMapLegend";
import type { FacilityBuilding } from "../api/facility.types";
import type { LayerKey } from "../data/facilityMockData";
import "../styles/facility-map.css";

export default function FacilityMapPage() {
  /* ── real backend data ───────────────────────────────────────────── */
  const query = useFacilityMap();
  const { deleteBuilding } = useFacilityActions();
  const toast = useToast();

  /* ── modal state ─────────────────────────────────────────────────── */
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addZoneFor, setAddZoneFor] = useState<FacilityBuilding | null>(null);

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

  /* ── helpers ─────────────────────────────────────────────────────── */
  const toggleLayer = (key: LayerKey) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSelectCamera = (id: string) => {
    setSelectedCameraId(id);
    setSelectedBuildingId(null);
  };
  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedCameraId(null);
  };

  const handleDeleteBuilding = async (building: FacilityBuilding) => {
    if (!window.confirm(`Remove "${building.name}" and all its zones?`)) return;
    try {
      await deleteBuilding.mutateAsync(building.id);
      toast.success(`${building.name} removed.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove building.");
    }
  };
  void handleDeleteBuilding;

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
          <p className="fm-custom-hd-desc">
            Real-time view of your sites, cameras, zones, and active alerts.
          </p>
        </div>

        {/* Right: breadcrumb · All Sites · Add Building */}
        <div className="fm-custom-hd-controls">
          {/* Breadcrumb — Home > Vision Guard > Facility Map */}
          <Breadcrumb
            items={[
              { label: "Vision Guard", to: "/vision-guard" },
              { label: "Facility Map" },
            ]}
          />

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
            <span title="Backend unavailable — showing mock data" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
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
        />

        {/* Centre: SVG Campus Map */}
        <div style={{ minWidth: 0 }}>
          <FacilityMapCampus
            layers={layers}
            zoneFilter={zoneFilter}
            selectedCameraId={selectedCameraId}
            selectedBuildingId={selectedBuildingId}
            onSelectCamera={handleSelectCamera}
            onSelectBuilding={handleSelectBuilding}
          />
        </div>

        {/* Right: Events + Selected Location */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <FacilityZoneEvents onSelectBuilding={handleSelectBuilding} />
          <SelectedLocationPanel
            selectedCameraId={selectedCameraId}
            selectedBuildingId={selectedBuildingId}
          />
        </div>
      </div>

      {/* Legend */}
      <FacilityMapLegend />

      {/* Modals */}
      <AddBuildingModal open={addBuildingOpen} onClose={() => setAddBuildingOpen(false)} />
      <AddZoneModal
        open={addZoneFor !== null}
        onClose={() => setAddZoneFor(null)}
        buildingId={addZoneFor?.id ?? null}
        buildingName={addZoneFor?.name ?? ""}
      />
    </>
  );
}
