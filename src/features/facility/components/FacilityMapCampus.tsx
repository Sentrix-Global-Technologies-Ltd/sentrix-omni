import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerKey } from "../data/facilityMockData";
import type { AllOrgCamera, FacilityCameraPin, FacilityBuilding, FeedStatus } from "../api/facility.types";
import { useConfigDrag, type GhostRect, type ResizeHandle } from "../hooks/useConfigDrag";
import { svgPtToBuildingPct } from "../utils/coordinateHelpers";

// ── ViewBox ──────────────────────────────────────────────────────────────────
const VB_W = 780;
const VB_H = 540;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4;
const DRAG_THRESHOLD = 4; // px — min movement before a pan gesture is committed

// ── Coordinate helpers (exported for tests) ───────────────────────────────────
export function buildingToSvgRect(b: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return {
    x: (b.x / 100) * VB_W,
    y: (b.y / 100) * VB_H,
    width: (b.width / 100) * VB_W,
    height: (b.height / 100) * VB_H,
  };
}

export function zoneToSvgRect(
  building: { x: number; y: number; width: number; height: number },
  zone: { x: number; y: number; width: number; height: number }
) {
  const { x: bx, y: by, width: bw, height: bh } = buildingToSvgRect(building);
  return {
    x: bx + (zone.x / 100) * bw,
    y: by + (zone.y / 100) * bh,
    width: (zone.width / 100) * bw,
    height: (zone.height / 100) * bh,
  };
}

// ── Campus floor-plan polygons (static artwork — keyed by polygon id) ─────────
const BUILDING_POLYGONS: Record<string, string> = {
  "bldg-a":    "325,88 334,72 382,72 382,62 478,62 478,72 531,72 540,88 558,88 558,148 540,148 540,210 508,210 508,222 356,222 356,210 325,210 325,168 308,168 308,108 325,108",
  "bldg-b":    "68,208 68,195 118,195 118,183 178,183 178,195 218,195 230,208 268,208 268,268 280,268 280,330 268,330 268,385 218,385 218,395 118,395 118,385 68,385 68,348 56,348 56,258 68,258",
  "bldg-c":    "594,194 594,178 644,178 644,168 702,168 702,178 750,178 755,194 755,248 768,248 768,288 755,288 755,326 710,326 710,335 622,335 622,326 590,326 590,282 578,282 578,228 590,228",
  "bldg-d":    "118,422 118,410 175,410 175,400 240,400 240,410 312,410 316,422 316,450 325,450 325,488 316,488 316,518 240,518 240,508 175,508 175,518 118,518 118,488 104,488 104,442 118,442",
  "bldg-e":    "368,414 368,400 420,400 420,390 492,390 492,400 548,400 552,414 552,444 562,444 562,480 552,480 552,514 492,514 492,504 420,504 420,514 368,514 368,480 358,480 358,434 368,434",
  "parking-a": "582,398 730,398 730,505 582,505",
};

// Per-polygon colour palette (matches original MOCK_BUILDINGS)
const POLY_PALETTES: Record<string, { fill: string; fillDark: string; stroke: string }> = {
  "bldg-a":    { fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.15)",   stroke: "#14b8a6" },
  "bldg-b":    { fill: "#dbeafe", fillDark: "rgba(59,130,246,0.15)",   stroke: "#3b82f6" },
  "bldg-c":    { fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.12)",   stroke: "#14b8a6" },
  "bldg-d":    { fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.15)",   stroke: "#14b8a6" },
  "bldg-e":    { fill: "#fed7aa", fillDark: "rgba(249,115,22,0.18)",   stroke: "#f97316" },
  "parking-a": { fill: "#f1f5f9", fillDark: "rgba(148,163,184,0.15)",  stroke: "#94a3b8" },
};

// Centroids for label placement (from MOCK_BUILDINGS: cx = x+w/2, cy = y+h/2)
const POLY_CENTROIDS: Record<string, { cx: number; cy: number }> = {
  "bldg-a":    { cx: 432.5, cy: 142 },
  "bldg-b":    { cx: 168,   cy: 289 },
  "bldg-c":    { cx: 673,   cy: 252 },
  "bldg-d":    { cx: 214.5, cy: 459 },
  "bldg-e":    { cx: 457,   cy: 452 },
  "parking-a": { cx: 656,   cy: 451 },
};

// Fallback palette for unmatched API buildings (cycle by index)
const BUILDING_PALETTE = [
  { fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.18)",  stroke: "#14b8a6" },
  { fill: "#dbeafe", fillDark: "rgba(59,130,246,0.18)",  stroke: "#3b82f6" },
  { fill: "#fef9c3", fillDark: "rgba(234,179,8,0.18)",   stroke: "#ca8a04" },
  { fill: "#fce7f3", fillDark: "rgba(236,72,153,0.18)",  stroke: "#ec4899" },
  { fill: "#e0e7ff", fillDark: "rgba(99,102,241,0.18)",  stroke: "#6366f1" },
  { fill: "#dcfce7", fillDark: "rgba(34,197,94,0.18)",   stroke: "#16a34a" },
];

// ── FeedStatus colour helper ──────────────────────────────────────────────────
function feedStatusColor(fs: FeedStatus): string {
  if (fs === "live")  return "#14b8a6";
  if (fs === "stale") return "#f59e0b";
  return "#94a3b8"; // offline / no_feed
}

// ── Computed camera positions ─────────────────────────────────────────────────
interface RenderedCamera {
  id: string;
  label: string;
  feedStatus: FeedStatus;
  cx: number;
  cy: number;
  buildingId: string;
  /** true = position came from stored map_x/map_y; false = auto grid layout. */
  isPlaced: boolean;
}

/**
 * Build the list of camera markers to render on the SVG map.
 *
 * A camera with stored map_x / map_y uses those building-relative
 * percentages to produce an exact SVG point (placed = true).
 * A camera with null coords falls back to the automatic grid layout
 * inside its zone rect (placed = false) so it still shows on the map
 * until the operator drags it into a permanent position.
 */
function buildCameraPositions(buildings: FacilityBuilding[]): RenderedCamera[] {
  const result: RenderedCamera[] = [];
  for (const b of buildings) {
    const bRect = buildingToSvgRect(b);
    for (const zone of b.zones) {
      const zRect = zoneToSvgRect(b, zone);
      const cams = zone.cameras;
      if (cams.length === 0) continue;

      // Cameras that have a stored position
      const placed = cams.filter((c) => c.map_x !== null && c.map_y !== null);
      // Cameras still awaiting placement — auto-grid in zone rect
      const unplaced = cams.filter((c) => c.map_x === null || c.map_y === null);

      placed.forEach((cam) => {
        // map_x / map_y are building-relative pct (0–100)
        const cx = bRect.x + ((cam.map_x as number) / 100) * bRect.width;
        const cy = bRect.y + ((cam.map_y as number) / 100) * bRect.height;
        result.push({ id: cam.id, label: cam.label, feedStatus: cam.feed_status, cx, cy, buildingId: b.id, isPlaced: true });
      });

      // Auto-grid for unplaced cameras (same algorithm as before)
      if (unplaced.length > 0) {
        const cols = Math.max(1, Math.ceil(Math.sqrt(unplaced.length)));
        const cellW = zRect.width / (cols + 1);
        const cellH = zRect.height / (Math.ceil(unplaced.length / cols) + 1);
        unplaced.forEach((cam, i) => {
          const col = (i % cols) + 1;
          const row = Math.floor(i / cols) + 1;
          result.push({
            id: cam.id, label: cam.label, feedStatus: cam.feed_status,
            cx: zRect.x + col * cellW, cy: zRect.y + row * cellH,
            buildingId: b.id, isPlaced: false,
          });
        });
      }
    }
  }
  return result;
}

/**
 * Returns cameras from all buildings that have no stored map position.
 * Used to populate the "Unplaced Cameras" sidebar in config mode.
 */
interface UnplacedCameraItem {
  id: string;
  label: string;
  type: string;
  feed_status: FeedStatus;
  map_x: number | null;
  map_y: number | null;
  buildingId: string | null;
  buildingName: string | null;
}

/**
 * Collects cameras that have not yet been placed on the facility map
 * (map_x === null OR map_y === null) and that are NOT already visible on the
 * map canvas via the auto-grid (i.e. not in renderedCameraIds).
 *
 * The auto-grid renders cameras that have a site/zone match but no explicit
 * map_x/map_y — those are visually present on the canvas already and must NOT
 * also appear in the Unplaced Cameras panel (symptom: 4 cameras shown instead
 * of 1). We exclude them by checking against the set of IDs buildCameraPositions
 * already emitted.
 *
 * When `allOrgCameras` is provided it is used as the authoritative source so
 * cameras with no site/zone match (i.e. not reachable via building→zone
 * traversal) are included.  Falls back to building traversal when the list is
 * empty or unavailable.
 */
function collectUnplacedCameras(
  buildings: FacilityBuilding[],
  allOrgCameras: AllOrgCamera[],
  renderedCameraIds: ReadonlySet<string>,
): UnplacedCameraItem[] {
  // Prefer the flat org-camera list — it includes cameras that have no
  // building/zone match and would be invisible via building traversal.
  if (allOrgCameras.length > 0) {
    // Build a quick lookup of building name → id so we can annotate each
    // camera with its target building (if any).
    const buildingByName = new Map(buildings.map((b) => [b.name, b]));

    return allOrgCameras
      .filter((c) => (c.map_x === null || c.map_y === null) && !renderedCameraIds.has(c.id))
      .map((c) => {
        const building = c.site ? buildingByName.get(c.site) : undefined;
        return {
          id: c.id,
          label: c.label,
          type: c.type,
          feed_status: c.feed_status,
          map_x: c.map_x,
          map_y: c.map_y,
          buildingId: building?.id ?? null,
          buildingName: building?.name ?? null,
        };
      });
  }

  // Fallback: traverse building → zone → camera tree (only finds cameras
  // whose site+zone already matches a seeded building/zone pair).
  const result: UnplacedCameraItem[] = [];
  for (const b of buildings) {
    for (const zone of b.zones) {
      for (const cam of zone.cameras) {
        if ((cam.map_x === null || cam.map_y === null) && !renderedCameraIds.has(cam.id)) {
          result.push({ ...cam, buildingId: b.id, buildingName: b.name });
        }
      }
    }
  }
  return result;
}

// ── Decorative background ─────────────────────────────────────────────────────
const PERIMETER =
  "M 62,118 Q 62,30 155,30 L 625,30 Q 722,30 722,118 L 722,490 Q 722,535 680,535 L 100,535 Q 62,535 62,490 Z";

const TREES: { x: number; y: number; r: number }[] = [
  { x: 88, y: 108, r: 9 }, { x: 100, y: 122, r: 7 }, { x: 78, y: 128, r: 6 },
  { x: 112, y: 108, r: 5 }, { x: 90, y: 140, r: 7 }, { x: 104, y: 148, r: 5 },
  { x: 668, y: 100, r: 8 }, { x: 682, y: 112, r: 6 }, { x: 660, y: 118, r: 7 },
  { x: 695, y: 105, r: 5 }, { x: 675, y: 126, r: 6 }, { x: 648, y: 110, r: 5 },
  { x: 278, y: 148, r: 7 }, { x: 290, y: 162, r: 6 }, { x: 268, y: 168, r: 5 },
  { x: 284, y: 178, r: 7 }, { x: 270, y: 140, r: 5 },
  { x: 560, y: 150, r: 7 }, { x: 572, y: 162, r: 6 }, { x: 555, y: 170, r: 5 },
  { x: 568, y: 180, r: 7 }, { x: 580, y: 155, r: 5 },
  { x: 330, y: 252, r: 8 }, { x: 345, y: 268, r: 6 }, { x: 320, y: 268, r: 5 },
  { x: 438, y: 255, r: 8 }, { x: 450, y: 268, r: 6 }, { x: 428, y: 272, r: 5 },
  { x: 365, y: 288, r: 6 }, { x: 408, y: 290, r: 6 },
  { x: 152, y: 395, r: 7 }, { x: 166, y: 408, r: 6 }, { x: 142, y: 408, r: 5 },
  { x: 158, y: 420, r: 7 }, { x: 170, y: 425, r: 5 },
  { x: 578, y: 342, r: 7 }, { x: 590, y: 355, r: 6 }, { x: 570, y: 358, r: 5 },
  { x: 585, y: 368, r: 7 }, { x: 600, y: 365, r: 5 },
  { x: 168, y: 522, r: 8 }, { x: 182, y: 534, r: 6 }, { x: 155, y: 532, r: 5 },
  { x: 330, y: 524, r: 7 }, { x: 344, y: 534, r: 6 }, { x: 320, y: 536, r: 5 },
  { x: 548, y: 520, r: 7 }, { x: 562, y: 530, r: 6 }, { x: 540, y: 532, r: 5 },
  { x: 72, y: 302, r: 7 }, { x: 85, y: 314, r: 6 }, { x: 70, y: 322, r: 5 },
  { x: 72, y: 418, r: 7 }, { x: 85, y: 428, r: 6 }, { x: 70, y: 438, r: 5 },
  { x: 705, y: 380, r: 7 }, { x: 718, y: 390, r: 5 }, { x: 705, y: 400, r: 6 },
  { x: 705, y: 268, r: 7 }, { x: 718, y: 280, r: 5 }, { x: 705, y: 292, r: 6 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CameraMarker({
  cam,
  selected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  cam: RenderedCamera;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent, id: string) => void;
  onMouseLeave: () => void;
}) {
  const fill = feedStatusColor(cam.feedStatus);
  return (
    <g
      onClick={onClick}
      onMouseEnter={(e) => onMouseEnter(e, cam.id)}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={cam.label}
    >
      {selected && (
        <circle cx={cam.cx} cy={cam.cy} r={17} fill="none" stroke={fill} strokeWidth={2} opacity={0.4} />
      )}
      <circle cx={cam.cx} cy={cam.cy} r={11} fill={fill} stroke="white" strokeWidth={selected ? 2.5 : 1.5} />
      <g transform={`translate(${cam.cx - 6},${cam.cy - 4.5})`}>
        <rect x={0} y={1.5} width={8} height={5.5} rx={1} fill="white" opacity={0.9} />
        <path d="M8,2.5 L11,1 L11,7 L8,5.5 Z" fill="white" opacity={0.9} />
      </g>
    </g>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  buildings: FacilityBuilding[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  layers: Record<LayerKey, boolean>;
  zoneFilter: string;
  selectedCameraId: string | null;
  selectedBuildingId: string | null;
  onSelectCamera: (id: string) => void;
  onSelectBuilding: (id: string) => void;
  /** When true, replaces monitoring interactions with configuration-edit gestures. */
  configMode?: boolean;
  /**
   * Called when the user completes a draw gesture of sufficient size.
   * Receives the clamped map-pct rect. The parent opens AddBuildingModal.
   */
  onDrawComplete?: (rect: GhostRect) => void;
  /** Building currently selected for editing in configMode (shows resize handles). */
  editingBuildingId?: string | null;
  /** Committed draft geometry (from page) shown between drags, before Save. */
  editDraftRect?: GhostRect | null;
  /** Called when user mousedowns on an existing building in configMode. */
  onEditSelect?: (buildingId: string) => void;
  /** Called when a move drag completes. Page stores this as draft. */
  onMoveComplete?: (buildingId: string, rect: GhostRect) => void;
  /** Called when a resize drag completes. Page stores this as draft. */
  onResizeComplete?: (buildingId: string, rect: GhostRect) => void;
  // ── Zone editing (Batch 2-E) ─────────────────────────────────────────────
  /** Zone currently selected for editing in configMode (shows resize handles). */
  editingZoneId?: string | null;
  /** Committed draft geometry (zone-pct) for the editing zone, stored by page between drags. */
  editZoneDraftRect?: GhostRect | null;
  /** Called when user clicks a zone body in configMode while its parent building is selected. */
  onZoneEditSelect?: (buildingId: string, zoneId: string) => void;
  /** Called when user completes a zone draw gesture of sufficient size (zone-pct rect). */
  onZoneDrawComplete?: (buildingId: string, rect: GhostRect) => void;
  /** Called when user completes a zone move drag of sufficient distance (zone-pct rect). */
  onZoneMoveComplete?: (buildingId: string, zoneId: string, rect: GhostRect) => void;
  /** Called when user completes a zone resize drag (zone-pct rect). */
  onZoneResizeComplete?: (buildingId: string, zoneId: string, rect: GhostRect) => void;
  /**
   * Called when the user drops a camera from the unplaced-cameras sidebar
   * onto a building on the map. Receives the camera id, target building id,
   * and building-relative pct coords. The parent must PATCH and invalidate.
   */
  onPlaceCamera?: (cameraId: string, buildingId: string, mapX: number, mapY: number, buildingName: string, zoneName: string | null) => void;
  /**
   * All org camera sources, fetched independently of the facility map so
   * cameras with no site/zone match (not reachable via building traversal) are
   * included in the Unplaced Cameras panel. When omitted, the panel falls back
   * to building-traversal discovery (Phase 3 behaviour).
   */
  allOrgCameras?: AllOrgCamera[];
}

export default function FacilityMapCampus({
  buildings,
  isLoading = false,
  isError = false,
  onRetry,
  layers,
  zoneFilter,
  selectedCameraId,
  selectedBuildingId,
  onSelectCamera,
  onSelectBuilding,
  configMode = false,
  onDrawComplete,
  editingBuildingId = null,
  editDraftRect = null,
  onEditSelect,
  onMoveComplete,
  onResizeComplete,
  editingZoneId = null,
  editZoneDraftRect = null,
  onZoneEditSelect,
  onZoneDrawComplete,
  onZoneMoveComplete,
  onZoneResizeComplete,
  onPlaceCamera,
  allOrgCameras = [],
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // ── Camera placement drag-and-drop state ──────────────────────────────────
  // draggingCameraId: id of a camera being dragged from the unplaced sidebar
  const [draggingCameraId, setDraggingCameraId] = useState<string | null>(null);
  const [dropHighlightBuildingId, setDropHighlightBuildingId] = useState<string | null>(null);
  const isDragging = useRef(false);
  const didDragRef = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // zoomRef mirrors zoom state so button callbacks can read the latest zoom
  // without nesting setPan inside setZoom's updater function.
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  const {
    dragState,
    ghostRect,
    editLiveRect,
    isDrawing,
    editingTargetId,
    zoneGhostRect,
    zoneEditLiveRect,
    editingZoneId: hookEditingZoneId,
    editingZoneBuildingId,
    onConfigMouseDown,
    onConfigMouseMove,
    onConfigMouseUp,
    cancelDrag,
    onMoveStart,
    onResizeStart,
    onZoneDrawStart,
    onZoneMoveStart,
    onZoneResizeStart,
  } = useConfigDrag(configMode, {
    onDrawComplete,
    onMoveComplete,
    onResizeComplete,
    onZoneDrawComplete,
    onZoneMoveComplete,
    onZoneResizeComplete,
  });

  const handleZoomIn = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const prev = zoomRef.current;
    const next = Math.min(MAX_ZOOM, +(prev * 1.3).toFixed(3));
    if (next === prev) return;
    zoomRef.current = next; // update immediately so rapid clicks accumulate correctly
    setZoom(next);
    setPan((p) => ({
      x: cx - (cx - p.x) * (next / prev),
      y: cy - (cy - p.y) * (next / prev),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const prev = zoomRef.current;
    const next = Math.max(MIN_ZOOM, +(prev / 1.3).toFixed(3));
    if (next === prev) return;
    zoomRef.current = next;
    setZoom(next);
    setPan((p) => ({
      x: cx - (cx - p.x) * (next / prev),
      y: cy - (cy - p.y) * (next / prev),
    }));
  }, []);

  const handleReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor));
      setPan((p) => ({
        x: mouseX - (mouseX - p.x) * (next / prev),
        y: mouseY - (mouseY - p.y) * (next / prev),
      }));
      return next;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (configMode) {
      if (svgRef.current) onConfigMouseDown(e, svgRef.current);
      return; // suppress pan in configuration mode
    }
    // Let zoom-control buttons handle their own clicks; don't start panning.
    if ((e.target as Element).closest('button')) return;
    isDragging.current = true;
    didDragRef.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (configMode) {
      if (svgRef.current) onConfigMouseMove(e, svgRef.current);
      return;
    }
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (!didDragRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      didDragRef.current = true;
    }
    if (didDragRef.current) {
      setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    }
  };
  const handleMouseUp = () => {
    if (configMode) { onConfigMouseUp(); return; }
    isDragging.current = false;
    // didDragRef intentionally NOT cleared here; onClickCapture fires next
    // and reads it to suppress the building-selection click.
  };
  const handleMouseLeave = () => {
    if (configMode) { onConfigMouseUp(); return; }
    isDragging.current = false;
    didDragRef.current = false; // no click event follows mouseLeave
  };
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) {
      // Always clear the flag — even for button clicks (so next interaction is clean)
      didDragRef.current = false;
      // Suppress building-selection clicks after a drag. Allow zoom button clicks
      // through even after a drag so controls remain immediately usable.
      if (!(e.target as Element).closest('button')) {
        e.stopPropagation();
      }
    }
  }, []);

  const handleMarkerEnter = (e: React.MouseEvent, id: string) => {
    const cam = renderedCameras.find((c) => c.id === id);
    if (!cam) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const statusLabel =
      cam.feedStatus === "live"  ? "Live" :
      cam.feedStatus === "stale" ? "Stale" : "Offline";
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: `${cam.label} · ${statusLabel}`,
    });
  };

  // Escape cancels any in-progress draw gesture.
  useEffect(() => {
    if (!configMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancelDrag(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [configMode, cancelDrag]);

  const renderedCameras = useMemo(() => buildCameraPositions(buildings), [buildings]);
  // Build a Set of IDs already visible on the canvas (placed + auto-grid) so
  // collectUnplacedCameras can exclude them from the Unplaced panel.
  const renderedCameraIds = useMemo(
    () => new Set(renderedCameras.map((c) => c.id)),
    [renderedCameras],
  );
  const unplacedCameras = useMemo(
    () => collectUnplacedCameras(buildings, allOrgCameras, renderedCameraIds),
    [buildings, allOrgCameras, renderedCameraIds],
  );

  // Visible API buildings under zone filter (all use stored x/y/width/height)
  const visibleBuildings = useMemo(() =>
    zoneFilter === "all"
      ? buildings.map((b, i) => ({ building: b, paletteIdx: i }))
      : buildings
          .map((b, i) => ({ building: b, paletteIdx: i }))
          .filter(({ building }) => building.id === zoneFilter),
    [zoneFilter, buildings]);

  const visibleCameras = useMemo(() =>
    layers.cameras
      ? zoneFilter === "all"
        ? renderedCameras
        : renderedCameras.filter((c) => c.buildingId === zoneFilter)
      : [],
    [layers.cameras, zoneFilter, renderedCameras]);

  const isEmpty = buildings.length === 0 && !isLoading && !isError;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const groundBase = isDark ? "#0e1e2e" : "#dce8d8";
  const grassFill  = isDark ? "#0d2218" : "#c2d8be";
  const roadFill   = isDark ? "#1a2d42" : "#b4c4cc";
  const roadLight  = isDark ? "#162438" : "#c8d8de";
  const treeFill   = isDark ? "#1a4a2e" : "#4e8a5a";

  return (
    <div
      className="fm-map-wrap"
      ref={wrapRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClickCapture={handleClickCapture}
      style={{
        cursor: configMode
          ? dragState.phase === "moving"        ? "move"
          : dragState.phase === "resizing"      ? `${dragState.handle}-resize`
          : dragState.phase === "zone-moving"   ? "move"
          : dragState.phase === "zone-resizing" ? `${dragState.handle}-resize`
          : "crosshair"
          : isDragging.current ? "grabbing" : "grab",
        position: "relative",
      }}
    >
      {/* Zoom controls */}
      <div className="fm-zoom-controls">
        <button className="fm-zoom-btn" onClick={handleZoomIn}  title="Zoom in">+</button>
        <button className="fm-zoom-btn" onClick={handleZoomOut} title="Zoom out">&minus;</button>
        <button className="fm-zoom-btn" onClick={handleReset}   title="Reset view" style={{ fontSize: "0.75rem" }}>⊙</button>
      </div>

      {/* ── Configuration mode toolbar ─────────────────────────────────── */}
      {configMode && (
        <div
          className="fm-config-toolbar"
          data-testid="config-mode-toolbar"
          role="status"
          aria-label="Configuration mode active"
        >
          <span className="fm-config-badge" aria-hidden="true">⚙</span>
          <span>
            {dragState.phase === "moving"          ? "Drag to move building — release to confirm"
            : dragState.phase === "resizing"        ? "Drag to resize building — release to confirm"
            : dragState.phase === "zone-moving"     ? "Drag to move zone — release to confirm"
            : dragState.phase === "zone-resizing"   ? "Drag to resize zone — release to confirm"
            : dragState.phase === "zone-drawing"    ? "Drag to draw zone — release to name"
            : isDrawing                             ? "Drag to draw building — release to name"
            : editingZoneId                         ? "Drag zone to move · drag handle to resize · click away to deselect"
            : editingBuildingId                     ? "Click inside building to draw zone · drag building to move · drag handle to resize"
            :                                         "Click a building to select · drag to draw new"}
          </span>
        </div>
      )}

      <div
        className="fm-map-inner"
        style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          style={{ display: "block" }}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Facility campus map"
        >
          {/* ── AERIAL BACKGROUND (decorative) ──────────────────────────── */}
          <rect width={VB_W} height={VB_H} fill={isDark ? "#091520" : "#ced8d0"} />
          <path
            d="M 62,118 Q 62,30 155,30 L 625,30 Q 722,30 722,118 L 722,490 Q 722,535 680,535 L 100,535 Q 62,535 62,490 Z"
            fill={groundBase}
          />
          {/* Grass patches */}
          <ellipse cx={162} cy={295} rx={72} ry={58} fill={grassFill} opacity={0.75} />
          <ellipse cx={530} cy={252} rx={48} ry={36} fill={grassFill} opacity={0.65} />
          <ellipse cx={390} cy={300} rx={44} ry={30} fill={grassFill} opacity={0.6} />
          <ellipse cx={658} cy={420} rx={36} ry={26} fill={grassFill} opacity={0.55} />
          <ellipse cx={390} cy={468} rx={28} ry={18} fill={grassFill} opacity={0.5} />
          <ellipse cx={160} cy={462} rx={50} ry={20} fill={grassFill} opacity={0.45} />
          {/* Roads */}
          <path
            d="M 98,120 Q 98,68 152,68 L 628,68 Q 700,68 700,120 L 700,482 Q 700,512 668,512 L 112,512 Q 98,512 98,482 Z"
            fill="none" stroke={roadFill} strokeWidth={22}
          />
          <rect x={265} y={304} width={250} height={20} fill={roadFill} />
          <rect x={376} y={68}  width={20}  height={240} fill={roadFill} />
          <rect x={376} y={324} width={20}  height={188} fill={roadFill} />
          <rect x={98}  y={306} width={170} height={20}  fill={roadFill} />
          <rect x={518} y={306} width={182} height={20}  fill={roadFill} />
          <rect x={356} y={490} width={60}  height={26}  fill={roadFill} />
          <rect x={371} y={510} width={30}  height={28}  fill={roadFill} />
          {/* Roundabout */}
          <circle cx={386} cy={314} r={32} fill={roadFill} />
          <circle cx={386} cy={314} r={22} fill={grassFill} opacity={0.8} />
          <circle cx={386} cy={314} r={9}  fill={roadLight} />
          {/* Road centre lines */}
          <rect x={266} y={300} width={250} height={4} fill={roadLight} opacity={0.6} />
          <rect x={374} y={68}  width={4}   height={240} fill={roadLight} opacity={0.6} />
          {/* Parking lot surface */}
          <rect x={582} y={398} width={148} height={107} fill={isDark ? "#182838" : "#c8d4dc"} opacity={0.8} />
          {[410, 425, 440, 455, 470, 485].map((y) => (
            <line key={y} x1={582} y1={y} x2={730} y2={y} stroke={roadFill} strokeWidth={1} opacity={0.5} />
          ))}
          {[600, 620, 640, 660, 680, 700, 720].map((x) => (
            <line key={x} x1={x} y1={398} x2={x} y2={505} stroke={roadFill} strokeWidth={0.8} opacity={0.4} />
          ))}
          {/* Trees */}
          {TREES.map((t, i) => (
            <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={treeFill} opacity={isDark ? 0.6 : 0.72} />
          ))}
          {TREES.map((t, i) => (
            <circle key={`s${i}`} cx={t.x + 2} cy={t.y + 2} r={t.r * 0.55}
              fill={isDark ? "#000" : "#3a6040"} opacity={0.18} />
          ))}

          {/* ── PERIMETER ───────────────────────────────────────────────── */}
          {layers.perimeter && (
            <path d={PERIMETER} fill="none" stroke="#14b8a6" strokeWidth={2.5}
              strokeDasharray="11,5" opacity={0.9} />
          )}

          {/* ── CAMPUS FLOOR-PLAN ARTWORK (static, non-interactive) ────────────
              The BUILDING_POLYGONS are decorative background artwork showing the
              architectural shapes of the campus buildings. They are NOT tied to
              any API building record — they render at fixed coordinates and do
              not respond to clicks. API buildings below overlay them using the
              stored x/y/width/height coordinates from the database.           */}
          <g pointerEvents="none" aria-hidden="true">
            {Object.entries(BUILDING_POLYGONS).map(([polyId, points]) => {
              const palette = POLY_PALETTES[polyId] ?? POLY_PALETTES["bldg-a"];
              return (
                <polygon
                  key={polyId}
                  points={points}
                  fill={isDark ? palette.fillDark : palette.fill}
                  stroke={palette.stroke}
                  strokeWidth={1.4}
                  opacity={0.72}
                />
              );
            })}
          </g>

          {/* ── API BUILDINGS (stored coordinates, interactive) ───────────────
              Every building from the API is rendered via its stored x/y/width/
              height percentages, converted to SVG coordinates by
              buildingToSvgRect(). This is the authoritative operational layer.
              No name-matching — coordinates drive placement.                  */}
          {visibleBuildings.map(({ building: b, paletteIdx }) => {
            const palette   = BUILDING_PALETTE[paletteIdx % BUILDING_PALETTE.length];
            const isSelected  = selectedBuildingId === b.id;
            const isEditing   = configMode && editingBuildingId === b.id;
            const totalCams   = b.zones.reduce((s, z) => s + z.cameras_total, 0) + b.unzoned_cameras_total;

            // During active drag use hook's live rect; between drags use committed
            // draft from parent; otherwise fall back to DB coordinates.
            const pctRect: GhostRect =
              isEditing && editingTargetId === b.id && editLiveRect
                ? editLiveRect
                : isEditing && editDraftRect
                ? editDraftRect
                : { x: b.x, y: b.y, width: b.width, height: b.height };
            const rect = buildingToSvgRect(pctRect);

            // Resize handle positions (SVG coords)
            const HANDLE_R = 5; // half-size of 10×10 handle
            const handlePoints: Array<{ h: ResizeHandle; hx: number; hy: number }> = [
              { h: "nw", hx: rect.x,                    hy: rect.y },
              { h: "n",  hx: rect.x + rect.width / 2,   hy: rect.y },
              { h: "ne", hx: rect.x + rect.width,        hy: rect.y },
              { h: "w",  hx: rect.x,                    hy: rect.y + rect.height / 2 },
              { h: "e",  hx: rect.x + rect.width,        hy: rect.y + rect.height / 2 },
              { h: "sw", hx: rect.x,                    hy: rect.y + rect.height },
              { h: "s",  hx: rect.x + rect.width / 2,   hy: rect.y + rect.height },
              { h: "se", hx: rect.x + rect.width,        hy: rect.y + rect.height },
            ];

            return (
              <g
                key={b.id}
                onClick={configMode ? undefined : () => onSelectBuilding(b.id)}
                onMouseDown={configMode ? (e: React.MouseEvent) => {
                  if (!svgRef.current) return;
                  if (isEditing) {
                    // Building already selected → start drawing a zone inside it
                    onZoneDrawStart(e, svgRef.current, b.id, pctRect);
                  } else {
                    // Unselected building → select it and start a building move
                    onEditSelect?.(b.id);
                    onMoveStart(e, svgRef.current, b.id, pctRect);
                  }
                } : undefined}
                style={{ cursor: configMode ? (isEditing ? "move" : "pointer") : "pointer" }}
                role={configMode ? undefined : "button"}
                aria-label={b.name}
                data-building-id={b.id}
              >
                {/* Selection halo (monitoring mode) */}
                {isSelected && !configMode && (
                  <rect x={rect.x - 3} y={rect.y - 3}
                    width={rect.width + 6} height={rect.height + 6}
                    rx={4} fill="none" stroke={palette.stroke} strokeWidth={4} opacity={0.3} />
                )}
                {/* Edit-mode selection halo */}
                {isEditing && (
                  <rect x={rect.x - 4} y={rect.y - 4}
                    width={rect.width + 8} height={rect.height + 8}
                    rx={4} fill="none" stroke="#6366f1" strokeWidth={2} opacity={0.5}
                    strokeDasharray="5,3"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {/* Building boundary */}
                <rect
                  x={rect.x} y={rect.y}
                  width={rect.width} height={rect.height}
                  rx={3}
                  fill={isDark ? palette.fillDark : palette.fill}
                  fillOpacity={isSelected || isEditing ? 0.28 : 0.18}
                  stroke={isEditing ? "#6366f1" : palette.stroke}
                  strokeWidth={isSelected || isEditing ? 2.5 : 1.8}
                  strokeDasharray={isSelected || isEditing ? undefined : "6,3"}
                />
                {/* Zone overlays (interactive in config mode when building is selected) */}
                {layers.zones && b.zones.map((zone) => {
                  const isZoneSelected = editingZoneId === zone.id;
                  const isZoneDragging = hookEditingZoneId === zone.id;

                  // Zone-pct rect to display: live drag > committed draft > DB value
                  const displayZonePct: GhostRect =
                    isZoneDragging && zoneEditLiveRect
                      ? zoneEditLiveRect
                      : isZoneSelected && editZoneDraftRect
                      ? editZoneDraftRect
                      : { x: zone.x, y: zone.y, width: zone.width, height: zone.height };

                  // Convert using the currently-displayed building rect as the coordinate frame
                  const zr = zoneToSvgRect(pctRect, displayZonePct);

                  const ZONE_HANDLE_R = 4;
                  const zoneHandlePoints: Array<{ h: ResizeHandle; hx: number; hy: number }> =
                    isZoneSelected
                      ? [
                          { h: "nw", hx: zr.x,                  hy: zr.y },
                          { h: "n",  hx: zr.x + zr.width / 2,   hy: zr.y },
                          { h: "ne", hx: zr.x + zr.width,        hy: zr.y },
                          { h: "w",  hx: zr.x,                  hy: zr.y + zr.height / 2 },
                          { h: "e",  hx: zr.x + zr.width,        hy: zr.y + zr.height / 2 },
                          { h: "sw", hx: zr.x,                  hy: zr.y + zr.height },
                          { h: "s",  hx: zr.x + zr.width / 2,   hy: zr.y + zr.height },
                          { h: "se", hx: zr.x + zr.width,        hy: zr.y + zr.height },
                        ]
                      : [];

                  return (
                    <g
                      key={zone.id}
                      onClick={configMode && isEditing ? (e) => {
                        e.stopPropagation();
                        onZoneEditSelect?.(b.id, zone.id);
                      } : undefined}
                      style={{ cursor: configMode && isEditing ? "pointer" : undefined }}
                      data-zone-id={zone.id}
                    >
                      {/* Zone boundary rect */}
                      <rect
                        x={zr.x} y={zr.y}
                        width={zr.width} height={zr.height}
                        rx={2}
                        fill={isZoneSelected ? "rgba(99,102,241,0.10)" : "none"}
                        stroke={isZoneSelected ? "#6366f1" : palette.stroke}
                        strokeWidth={isZoneSelected ? 2 : 1.2}
                        strokeDasharray={isZoneSelected ? "5,3" : "4,3"}
                        opacity={isZoneSelected ? 1 : 0.7}
                        style={{
                          cursor: configMode && isEditing && isZoneSelected ? "move" : undefined,
                          pointerEvents: configMode && isEditing ? "all" : "none",
                        }}
                        onMouseDown={configMode && isEditing && isZoneSelected ? (e) => {
                          e.stopPropagation();
                          if (!svgRef.current) return;
                          onZoneMoveStart(e, svgRef.current, b.id, pctRect, zone.id, displayZonePct);
                        } : undefined}
                      />
                      {/* Zone resize handles (visible only while zone is selected) */}
                      {isZoneSelected && zoneHandlePoints.map(({ h, hx, hy }) => (
                        <rect
                          key={h}
                          data-testid={`zone-resize-handle-${h}`}
                          x={hx - ZONE_HANDLE_R} y={hy - ZONE_HANDLE_R}
                          width={ZONE_HANDLE_R * 2} height={ZONE_HANDLE_R * 2}
                          rx={2}
                          fill="#fff"
                          stroke="#6366f1"
                          strokeWidth={1.5}
                          style={{ cursor: `${h}-resize`, pointerEvents: "all" }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!svgRef.current) return;
                            onZoneResizeStart(
                              e as unknown as React.MouseEvent,
                              svgRef.current,
                              b.id, pctRect,
                              zone.id, h, displayZonePct,
                            );
                          }}
                        />
                      ))}
                    </g>
                  );
                })}
                {/* Zone draw ghost — shown during zone-drawing gesture on this building */}
                {configMode && isEditing && editingZoneBuildingId === b.id && zoneGhostRect && (() => {
                  const gr = zoneToSvgRect(pctRect, zoneGhostRect);
                  return (
                    <g data-testid="zone-ghost-rect-group" aria-hidden="true" style={{ pointerEvents: "none" }}>
                      <rect
                        data-testid="zone-ghost-rect"
                        x={gr.x} y={gr.y}
                        width={gr.width} height={gr.height}
                        rx={2}
                        fill="rgba(99,102,241,0.15)"
                        stroke="#6366f1"
                        strokeWidth={1.5}
                        strokeDasharray="5,3"
                      />
                    </g>
                  );
                })()}
                {/* Labels */}
                {layers["building-labels"] && (
                  <>
                    <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 - 7}
                      textAnchor="middle" fontSize={13} fontWeight="700"
                      fontFamily="system-ui,sans-serif"
                      fill={isDark ? "rgba(255,255,255,0.88)" : "#1e293b"}
                      style={{ pointerEvents: "none" }}>
                      {b.name}
                    </text>
                    <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 + 10}
                      textAnchor="middle" fontSize={11}
                      fontFamily="system-ui,sans-serif"
                      fill={isDark ? "rgba(255,255,255,0.5)" : "#475569"}
                      style={{ pointerEvents: "none" }}>
                      {totalCams} Camera{totalCams !== 1 ? "s" : ""}
                    </text>
                  </>
                )}
                {/* ── Resize handles (config mode, selected building) ── */}
                {isEditing && handlePoints.map(({ h, hx, hy }) => (
                  <rect
                    key={h}
                    data-testid={`resize-handle-${h}`}
                    x={hx - HANDLE_R} y={hy - HANDLE_R}
                    width={HANDLE_R * 2} height={HANDLE_R * 2}
                    rx={2}
                    fill="#fff"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    style={{ cursor: `${h}-resize`, pointerEvents: "all" }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!svgRef.current) return;
                      onResizeStart(e as unknown as React.MouseEvent, svgRef.current, b.id, h, pctRect);
                    }}
                  />
                ))}
              </g>
            );
          })}

          {/* ── DROP-ZONE HIGHLIGHTS (config mode camera placement) ────────── */}
          {configMode && draggingCameraId && visibleBuildings.map(({ building }) => {
            const r = buildingToSvgRect(building);
            const isHighlighted = dropHighlightBuildingId === building.id;
            return (
              <rect
                key={`drop-${building.id}`}
                x={r.x} y={r.y} width={r.width} height={r.height}
                fill={isHighlighted ? "rgba(20,184,166,0.18)" : "transparent"}
                stroke={isHighlighted ? "#14b8a6" : "transparent"}
                strokeWidth={2}
                strokeDasharray="6,3"
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
              />
            );
          })}

          {/* ── CAMERA MARKERS (from API) ────────────────────────────────── */}
          {visibleCameras.map((cam) => (
            <CameraMarker
              key={cam.id}
              cam={cam}
              selected={selectedCameraId === cam.id}
              onClick={configMode ? () => {} : () => onSelectCamera(cam.id)}
              onMouseEnter={configMode ? () => {} : handleMarkerEnter}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* ── ALERT MARKERS ────────────────────────────────────────────
              No real alert API data yet. Layer toggle preserved; renders
              nothing until a genuine /facility/alerts endpoint is wired.     */}
          {layers.alerts && null}

          {/* ── ACCESS-POINT MARKERS ─────────────────────────────────────
              No real access-point API data yet. Layer toggle preserved;
              renders nothing until a genuine endpoint is wired.              */}
          {layers["access-points"] && null}

          {/* Main entrance label */}
          {layers["building-labels"] && (
            <text
              x={386} y={524}
              textAnchor="middle" fontSize={11} fontWeight="600"
              fontFamily="system-ui,sans-serif"
              fill={isDark ? "rgba(255,255,255,0.45)" : "#64748b"}
            >
              Main Entrance
            </text>
          )}

          {/* ── CONFIGURATION MODE — ghost draw rectangle ──────────────
              Rendered during an in-progress draw gesture (Batch 2-A/B).
              In Batch 2-C, releasing the mouse will open AddBuildingModal
              pre-filled with these normalised map-pct coordinates.       */}
          {configMode && ghostRect && (() => {
            const gr = buildingToSvgRect(ghostRect);
            // Label: show rounded pct dimensions so the user knows what they drew.
            const labelX = gr.x + gr.width / 2;
            const labelY = gr.y > 20 ? gr.y - 6 : gr.y + gr.height + 14;
            const labelText = `${Math.round(ghostRect.width)}% × ${Math.round(ghostRect.height)}%`;
            return (
              <g data-testid="ghost-rect-group" aria-hidden="true" style={{ pointerEvents: "none" }}>
                <rect
                  data-testid="ghost-rect"
                  x={gr.x} y={gr.y}
                  width={gr.width} height={gr.height}
                  rx={3}
                  fill="rgba(99,102,241,0.12)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="7,4"
                />
                <text
                  data-testid="ghost-rect-label"
                  x={labelX} y={labelY}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#6366f1"
                  fontFamily="system-ui,sans-serif"
                >
                  {labelText}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Overlay: loading */}
      {isLoading && (
        <div className="fm-canvas-overlay" role="status" aria-label="Loading map">
          <div className="fm-canvas-state-box">
            <svg
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: "fm-spin 1s linear infinite" }}
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.2} />
              <path d="M12 3a9 9 0 019 9" />
            </svg>
            <span>Loading map&hellip;</span>
          </div>
        </div>
      )}

      {/* Overlay: error */}
      {isError && !isLoading && (
        <div className="fm-canvas-overlay" role="alert">
          <div className="fm-canvas-state-box">
            <span>Failed to load map data.</span>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: "0.25rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlay: empty */}
      {isEmpty && (
        <div className="fm-canvas-overlay">
          <div className="fm-canvas-state-box">
            <span>No buildings configured yet.</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
              Use &ldquo;Add Building&rdquo; to place your first site.
            </span>
          </div>
        </div>
      )}

      {tooltip && (
        <div className="fm-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {/* ── UNPLACED CAMERAS SIDEBAR (config mode) ──────────────────────
          Shown when there are cameras without map positions. Drag a chip
          onto a building to place it; the parent calls onPlaceCamera
          which PATCHes the position and invalidates the query.         */}
      {configMode && unplacedCameras.length > 0 && (
        <div
          className="fm-unplaced-panel"
          aria-label="Unplaced cameras"
          data-testid="unplaced-cameras-panel"
        >
          <p className="fm-unplaced-title">
            Unplaced cameras ({unplacedCameras.length})
          </p>
          <p className="fm-unplaced-hint">
            Drag a camera onto a building to position it on the map.
          </p>
          <ul className="fm-unplaced-list">
            {unplacedCameras.map((cam) => (
              <li key={cam.id}>
                <div
                  className={`fm-unplaced-chip${draggingCameraId === cam.id ? " fm-unplaced-chip--dragging" : ""}`}
                  draggable
                  title={`${cam.label}${cam.buildingName ? ` · ${cam.buildingName}` : ""}`}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", cam.id);
                    setDraggingCameraId(cam.id);
                  }}
                  onDragEnd={() => {
                    setDraggingCameraId(null);
                    setDropHighlightBuildingId(null);
                  }}
                >
                  <span
                    className="fm-unplaced-dot"
                    style={{ background: cam.feed_status === "live" ? "#22c55e" : cam.feed_status === "stale" ? "#f59e0b" : "#94a3b8" }}
                    aria-hidden="true"
                  />
                  <span className="fm-unplaced-label">{cam.label}</span>
                  {cam.buildingName && <span className="fm-unplaced-building">{cam.buildingName}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── SVG drop-zone dragover / drop handling ──────────────────────
          We attach dragover/drop to the outer wrapper so the SVG itself
          (which has pointer-events on buildings) receives the events.   */}
      {configMode && draggingCameraId && (
        <div
          className="fm-drop-overlay"
          aria-hidden="true"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            // Determine which building the pointer is over
            if (!svgRef.current || !wrapRef.current) return;
            const wrapRect = wrapRef.current.getBoundingClientRect();
            const svgEl = svgRef.current;
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            if (!ctm) return;
            const svgPt = pt.matrixTransform(ctm.inverse());
            // Find which building the point is inside
            const hit = buildings.find((b) => {
              const r = buildingToSvgRect(b);
              return svgPt.x >= r.x && svgPt.x <= r.x + r.width
                  && svgPt.y >= r.y && svgPt.y <= r.y + r.height;
            });
            setDropHighlightBuildingId(hit?.id ?? null);
          }}
          onDragLeave={() => setDropHighlightBuildingId(null)}
          onDrop={(e) => {
            e.preventDefault();
            const cameraId = e.dataTransfer.getData("text/plain");
            setDraggingCameraId(null);
            setDropHighlightBuildingId(null);
            if (!cameraId || !svgRef.current) return;
            const svgEl = svgRef.current;
            const pt = svgEl.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const ctm = svgEl.getScreenCTM();
            if (!ctm) return;
            const svgPt = pt.matrixTransform(ctm.inverse());
            const building = buildings.find((b) => {
              const r = buildingToSvgRect(b);
              return svgPt.x >= r.x && svgPt.x <= r.x + r.width
                  && svgPt.y >= r.y && svgPt.y <= r.y + r.height;
            });
            if (!building || !onPlaceCamera) return;
            const { x, y } = svgPtToBuildingPct(svgPt.x, svgPt.y, building);
            // Detect which zone the drop falls inside so the backend
            // can persist site/zone and the camera reappears after refresh.
            const hitZone = building.zones.find((z) => {
              const zr = zoneToSvgRect(building, z);
              return svgPt.x >= zr.x && svgPt.x <= zr.x + zr.width
                  && svgPt.y >= zr.y && svgPt.y <= zr.y + zr.height;
            });
            onPlaceCamera(cameraId, building.id, x, y, building.name, hitZone?.name ?? null);
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            cursor: "copy",
          }}
        />
      )}
    </div>
  );
}
