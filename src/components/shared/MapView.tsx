import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet is typed via the ambient shim in src/leaflet.d.ts (no @types dep).

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
}

/**
 * Shared Leaflet map (OpenStreetMap tiles, no API key). Uses vector
 * circle-markers so there are no image-asset path issues in the bundler.
 * Markers update reactively; the map initializes once.
 */
export default function MapView({ center, zoom = 12, markers, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Typed loosely: the leaflet types are shimmed (declare module above), so the
  // runtime objects are `any`. Keeps the build green without @types/leaflet.
  const mapRef = useRef<ReturnType<typeof L.map> | null>(null);
  const layerRef = useRef<ReturnType<typeof L.layerGroup> | null>(null);

  // Initialize once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers whenever they change.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markers.forEach((m) => {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        color: m.color,
        fillColor: m.color,
        fillOpacity: 0.85,
        weight: 2,
      });
      if (m.label) marker.bindPopup(m.label);
      marker.addTo(layer);
    });
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800"}
    />
  );
}
