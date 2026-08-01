import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { env } from "../../config/env";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Marker color (hex). */
  color: string;
  label?: string;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  className?: string;
  /** Called with the marker's `id` when it's clicked (e.g. navigate to its detail page). */
  onMarkerClick?: (id: string) => void;
}

// Single shared Loader instance: the loader itself dedupes concurrent/repeat
// `.load()` calls (and the underlying <script> tag) across every MapView on
// the page, so mounting multiple maps never double-injects the SDK.
const loader = new Loader({ apiKey: env.googleMapsApiKey, version: "weekly" });
let loadPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (!loadPromise) loadPromise = loader.importLibrary("maps").then(() => google);
  return loadPromise;
}

/**
 * Shared Google Maps view. Requires VITE_GOOGLE_MAPS_API_KEY (Maps JavaScript
 * API, browser key restricted by HTTP referrer — see .env.example). Markers
 * are colored circle symbols to match the console's status-color convention;
 * clicking one shows its label in an InfoWindow and fires onMarkerClick.
 */
export default function MapView({ center, zoom = 12, markers, className, onMarkerClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  // Kept current via a ref (not a useEffect dep) so the marker-render effect
  // below doesn't need to re-bind every marker just because the caller passed
  // a fresh callback identity on every render.
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  // Load the SDK once, then initialize the map once.
  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps().then((g) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      mapRef.current = new g.maps.Map(containerRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom,
      });
      infoWindowRef.current = new g.maps.InfoWindow();
      setMapsReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers whenever they (or map readiness) change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapsReady) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = markers.map((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: m.color,
          fillOpacity: 0.85,
          strokeColor: m.color,
          strokeWeight: 2,
        },
        title: m.label,
        cursor: "pointer",
      });
      marker.addListener("click", () => {
        if (m.label && infoWindowRef.current) {
          infoWindowRef.current.setContent(m.label);
          infoWindowRef.current.open({ map, anchor: marker });
        }
        onMarkerClickRef.current?.(m.id);
      });
      return marker;
    });
  }, [markers, mapsReady]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800"}
    />
  );
}
