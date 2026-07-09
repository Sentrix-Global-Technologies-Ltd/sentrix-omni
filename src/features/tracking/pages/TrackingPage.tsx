import { useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import RealtimeIndicator from "../../../components/ui/realtime/RealtimeIndicator";
import MapView, { type MapMarker } from "../../../components/shared/MapView";
import { useResponders } from "../../responders/hooks/useResponders";
import { useRespondersRealtime } from "../../responders/hooks/useRespondersRealtime";
import { responderLabel } from "../../responders/components/responderTone";
import { useEmergencies } from "../../emergencies/hooks/useEmergencies";
import { useEmergenciesRealtime } from "../../emergencies/hooks/useEmergenciesRealtime";

const COLORS = {
  available: "#12b76a",
  engaged: "#465fff",
  responderOther: "#98a2b3",
  emergency: "#f04438",
};

// Lagos.
const CENTER: [number, number] = [6.45, 3.4];

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-theme-sm text-gray-600 dark:text-gray-400">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/** Live operations map: on-duty responders + active emergencies. */
export default function TrackingPage() {
  const respondersQuery = useResponders({});
  const emergenciesQuery = useEmergencies({ status: "triggered" });
  const { connected } = useRespondersRealtime();
  useEmergenciesRealtime();

  const responders = respondersQuery.data?.data ?? [];
  const emergencies = emergenciesQuery.data?.data ?? [];

  const markers = useMemo<MapMarker[]>(() => {
    const responderMarkers: MapMarker[] = responders
      .filter((r) => r.last_lat != null && r.last_lng != null)
      .map((r) => ({
        id: `r-${r.id}`,
        lat: r.last_lat as number,
        lng: r.last_lng as number,
        color:
          r.status === "available"
            ? COLORS.available
            : r.status === "engaged"
              ? COLORS.engaged
              : COLORS.responderOther,
        label: `${responderLabel(r)} — ${r.status.replace(/_/g, " ")}`,
      }));

    const emergencyMarkers: MapMarker[] = emergencies
      .filter((e) => e.location.lat != null && e.location.lng != null)
      .map((e) => ({
        id: `e-${e.id}`,
        lat: Number(e.location.lat),
        lng: Number(e.location.lng),
        color: COLORS.emergency,
        label: `Emergency — ${e.severity}${e.message ? `: ${e.message}` : ""}`,
      }));

    return [...responderMarkers, ...emergencyMarkers];
  }, [responders, emergencies]);

  return (
    <>
      <PageMeta title="Live Tracking | Sentrix Console" description="Live operations map" />
      <PageHeader
        title="Live Tracking"
        breadcrumbs={[{ label: "Live Tracking" }]}
        actions={<RealtimeIndicator connected={connected} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <LegendDot color={COLORS.available} label="Available responder" />
        <LegendDot color={COLORS.engaged} label="Engaged responder" />
        <LegendDot color={COLORS.responderOther} label="Off / unavailable" />
        <LegendDot color={COLORS.emergency} label="Active emergency" />
        <span className="ml-auto text-theme-sm text-gray-400">
          {markers.length} on map
        </span>
      </div>

      <MapView center={CENTER} zoom={12} markers={markers} />
    </>
  );
}
