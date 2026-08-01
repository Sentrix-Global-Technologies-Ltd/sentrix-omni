import { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import Can from "../../../components/shared/Can";
import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useToast } from "../../../components/shared/toast";
import { useFacilityMap, useFacilityActions } from "../hooks/useFacilityMap";
import FacilityMapCanvas from "../components/FacilityMapCanvas";
import RecentZoneEvents from "../components/RecentZoneEvents";
import AddBuildingModal from "../components/AddBuildingModal";
import AddZoneModal from "../components/AddZoneModal";
import type { FacilityBuilding, FacilityZone } from "../api/facility.types";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]";

/**
 * Facility Map — a real-time view of the org's buildings, zones, and the
 * actual camera sources/detections matched to each (see FacilityMapController).
 * Selecting a building or zone shows its live camera roster in the side panel;
 * "Recent Zone Events" is pulled straight from detection_events.
 */
export default function FacilityMapPage() {
  const query = useFacilityMap();
  const { deleteBuilding, deleteZone } = useFacilityActions();
  const toast = useToast();

  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addZoneFor, setAddZoneFor] = useState<FacilityBuilding | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<FacilityZone | null>(null);

  const map = query.data?.data;
  const buildings = map?.buildings ?? [];
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) ?? null;

  const handleSelectZone = (buildingId: string, zone: FacilityZone) => {
    setSelectedBuildingId(buildingId);
    setSelectedZone(zone);
  };

  const handleSelectBuilding = (building: FacilityBuilding) => {
    setSelectedBuildingId(building.id);
    setSelectedZone(null);
  };

  const handleDeleteZone = async () => {
    if (!selectedBuildingId || !selectedZone) return;
    if (!window.confirm(`Remove zone "${selectedZone.name}"?`)) return;
    try {
      await deleteZone.mutateAsync({ buildingId: selectedBuildingId, zoneId: selectedZone.id });
      setSelectedZone(null);
      toast.success("Zone removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove zone.");
    }
  };

  const handleDeleteBuilding = async (building: FacilityBuilding) => {
    if (!window.confirm(`Remove "${building.name}" and all its zones?`)) return;
    try {
      await deleteBuilding.mutateAsync(building.id);
      if (selectedBuildingId === building.id) {
        setSelectedBuildingId(null);
        setSelectedZone(null);
      }
      toast.success(`${building.name} removed.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove building.");
    }
  };

  return (
    <>
      <PageMeta title="Facility Map | Sentrix Console" description="Real-time view of your sites, cameras and zones" />
      <PageHeader
        title="Facility Map"
        breadcrumbs={[{ label: "Vision Guard" }, { label: "Facility Map" }]}
        actions={
          <Can permission="hardware.register">
            <Button size="sm" variant="primary" onClick={() => setAddBuildingOpen(true)}>
              Add Building
            </Button>
          </Can>
        }
      />

      {query.isLoading ? (
        <LoadingState label="Loading facility map…" />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-8">
            <FacilityMapCanvas
              buildings={buildings}
              selectedZoneId={selectedZone?.id ?? null}
              onSelectZone={handleSelectZone}
              onSelectBuilding={handleSelectBuilding}
            />

            {selectedBuilding && (
              <div className={`${card} mt-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{selectedBuilding.name}</h3>
                  <Can permission="hardware.register">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAddZoneFor(selectedBuilding)}>
                        Add zone
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void handleDeleteBuilding(selectedBuilding)}>
                        Remove building
                      </Button>
                    </div>
                  </Can>
                </div>

                {selectedZone ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Zone: {selectedZone.name}</p>
                      <Can permission="hardware.register">
                        <button
                          onClick={() => void handleDeleteZone()}
                          className="text-theme-xs font-medium text-error-500 hover:underline"
                        >
                          Remove zone
                        </button>
                      </Can>
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedZone.cameras.length === 0 ? (
                        <p className="text-theme-xs text-gray-400">No cameras registered in this zone yet.</p>
                      ) : (
                        selectedZone.cameras.map((cam) => (
                          <div key={cam.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
                            <span className="text-sm text-gray-700 dark:text-gray-200">{cam.label}</span>
                            <StatusBadge tone={cam.feed_status === "live" ? "success" : cam.feed_status === "offline" ? "error" : "light"}>
                              {cam.feed_status}
                            </StatusBadge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-theme-xs text-gray-400">
                    {selectedBuilding.zones.length} zone(s) · {selectedBuilding.unzoned_cameras_total} camera(s) not
                    assigned to a drawn zone yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="col-span-12 xl:col-span-4">
            <div className={card}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Recent Zone Events</h3>
              <div className="mt-3">
                <RecentZoneEvents events={map?.recent_events ?? []} />
              </div>
            </div>
          </div>
        </div>
      )}

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
