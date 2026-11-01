import { useCallback, useEffect, useRef, useState } from "react";

// ─── Public tile map (OpenStreetMap) ─────────────────────────────────────────
// Free tiles — no API key required.
// Attribution rendered in bottom-right corner per OSM tile usage policy.
// Dark mode is achieved via CSS invert filter on the tile layer (no separate
// tile set needed), and follows the dashboard's own dark/light class toggle.
// ─────────────────────────────────────────────────────────────────────────────

const TILE_SIZE = 256;
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Marker fill color (hex or CSS color). */
  color: string;
  label?: string;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  className?: string;
  /** Called with the marker's `id` when it's clicked. */
  onMarkerClick?: (id: string) => void;
}

// ── Mercator tile math ────────────────────────────────────────────────────────

function lngToWorldX(lng: number, z: number): number {
  return ((lng + 180) / 360) * Math.pow(2, z) * TILE_SIZE;
}

function latToWorldY(lat: number, z: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, z) *
    TILE_SIZE
  );
}

// ── Tile URL helpers ──────────────────────────────────────────────────────────

function osmTileUrl(tx: number, ty: number, z: number): string {
  const sub = ["a", "b", "c"][(tx + ty) % 3];
  return `https://${sub}.tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
}

interface MapTile {
  key: string;
  src: string;
  left: number;
  top: number;
}

/**
 * Visible tile grid for the current viewport. A pure function kept outside the
 * component so MapView's body (which owns all the hooks) contains no loops.
 */
function buildTiles(
  zoom: number,
  tlWX: number,
  tlWY: number,
  tileX0: number,
  tileX1: number,
  tileY0: number,
  tileY1: number,
): MapTile[] {
  const maxTile = Math.pow(2, zoom);
  const tiles: MapTile[] = [];
  for (let tx = tileX0; tx < tileX1; tx++) {
    for (let ty = tileY0; ty < tileY1; ty++) {
      const nTx = ((tx % maxTile) + maxTile) % maxTile;
      const nTy = ((ty % maxTile) + maxTile) % maxTile;
      if (nTy < 0 || nTy >= maxTile) continue;
      tiles.push({
        key: `${nTx}-${nTy}-${zoom}`,
        src: osmTileUrl(nTx, nTy, zoom),
        left: tx * TILE_SIZE - tlWX,
        top: ty * TILE_SIZE - tlWY,
      });
    }
  }
  return tiles;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Lightweight slippy-map built on free OpenStreetMap tiles (no API key).
 * Supports zoom (+/- buttons and mouse wheel), pin markers, hover tooltips,
 * and click-to-navigate. Follows the dashboard's dark/light mode toggle:
 * defaults to light; applies a CSS invert filter in dark mode.
 *
 * Drop-in replacement for the Google Maps-based MapView — the
 * MapViewProps / MapMarker contract is identical.
 */
export default function MapView({
  center,
  zoom: initialZoom = 12,
  markers,
  className,
  onMarkerClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  const [zoom, setZoom] = useState(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom)));
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);

  // Track the dashboard's own dark/light toggle (Tailwind "dark" class on <html>).
  // Defaults to light. A MutationObserver watches for class changes so the map
  // tiles re-filter immediately whenever the user flips the theme switch.
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains("dark"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // Observe container dimensions.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      clampZoom(e.deltaY < 0 ? 1 : -1);
    },
    [clampZoom],
  );

  // ── Tile grid ───────────────────────────────────────────────────────────────
  const centerWX = lngToWorldX(center[1], zoom);
  const centerWY = latToWorldY(center[0], zoom);
  const halfW = size.w / 2;
  const halfH = size.h / 2;
  const tlWX = centerWX - halfW;
  const tlWY = centerWY - halfH;

  const tileX0 = Math.floor(tlWX / TILE_SIZE);
  const tileY0 = Math.floor(tlWY / TILE_SIZE);
  const tileX1 = Math.ceil((tlWX + size.w) / TILE_SIZE);
  const tileY1 = Math.ceil((tlWY + size.h) / TILE_SIZE);

  const tiles = buildTiles(zoom, tlWX, tlWY, tileX0, tileX1, tileY0, tileY1);

  // ── Markers in screen-space ─────────────────────────────────────────────────
  const pinPositions = markers.map((m) => ({
    ...m,
    sx: lngToWorldX(m.lng, zoom) - tlWX,
    sy: latToWorldY(m.lat, zoom) - tlWY,
  }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={
        className ??
        "relative h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800"
      }
      onWheel={onWheel}
      style={{ cursor: "grab", userSelect: "none" }}
    >
      {/* ── Tile layer ── */}
      {/* In dark mode a CSS invert filter gives a pleasant dark-theme map
          without a separate tile endpoint or API key. */}
      <div
        className="pointer-events-none absolute inset-0 transition-[filter] duration-300"
        style={isDark ? { filter: "invert(93%) hue-rotate(180deg) brightness(0.88) saturate(0.75)" } : undefined}
      >
        {tiles.map(({ key, src, left, top }) => (
          <img
            key={key}
            src={src}
            alt=""
            draggable={false}
            width={TILE_SIZE}
            height={TILE_SIZE}
            style={{ position: "absolute", left, top }}
          />
        ))}
      </div>

      {/* ── Pin layer ── */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={size.w}
        height={size.h}
        overflow="visible"
      >
        {pinPositions.map((m) => {
          const hovered = m.id === hoveredId;
          return (
            <g
              key={m.id}
              transform={`translate(${m.sx},${m.sy})`}
              style={{ cursor: "pointer", pointerEvents: "all" }}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onClickRef.current?.(m.id)}
            >
              {hovered && <circle r={18} fill={m.color} opacity={0.2} />}
              <circle r={10} fill={m.color} opacity={0.25} />
              <circle r={hovered ? 8 : 6} fill={m.color} stroke="white" strokeWidth={2} />
            </g>
          );
        })}
      </svg>

      {/* ── Tooltip ── */}
      {pinPositions
        .filter((m) => m.id === hoveredId && m.label)
        .map((m) => (
          <div
            key={`tip-${m.id}`}
            className="pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            style={{ left: m.sx, top: m.sy - 16, transform: "translate(-50%, -100%)" }}
          >
            {m.label}
            <span
              className="absolute left-1/2 top-full -translate-x-1/2"
              style={{
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `6px solid ${isDark ? "#111827" : "white"}`,
              }}
            />
          </div>
        ))}

      {/* ── Zoom controls ── */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        {(["+", "−"] as const).map((lbl, i) => (
          <button
            key={lbl}
            type="button"
            aria-label={i === 0 ? "Zoom in" : "Zoom out"}
            onClick={() => clampZoom(i === 0 ? 1 : -1)}
            className="flex size-8 items-center justify-center rounded-lg bg-white text-lg font-bold text-gray-700 shadow-md hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Required OSM attribution ── */}
      <div className="absolute bottom-1.5 right-2 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-500 backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-400">
        {"© "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700 dark:hover:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          OpenStreetMap
        </a>
        {" contributors"}
      </div>
    </div>
  );
}
