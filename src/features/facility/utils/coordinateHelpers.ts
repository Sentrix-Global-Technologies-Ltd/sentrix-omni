/**
 * coordinateHelpers.ts
 *
 * Coordinate conversion utilities for the Facility Map configuration editor.
 *
 * Coordinate spaces:
 *
 *   "map pct"    0-100 float stored in the database (Building.x/y/width/height).
 *                Zone coords are 0-100 relative to the parent building's box.
 *
 *   "SVG viewBox" pixels inside viewBox="0 0 780 540".
 *                Conversion: mapPct * VB_W / 100.
 *
 *   "screen"     CSS client coordinates (e.clientX / e.clientY).
 *                The SVG sits inside a CSS-transformed div
 *                (translate(panX,panY) scale(zoom)), so the mapping to
 *                viewBox is NOT a simple linear scale.  We use
 *                SVGSVGElement.getScreenCTM().inverse() so that viewBox
 *                scaling, preserveAspectRatio letterboxing and CSS
 *                zoom/pan are all handled by the browser automatically.
 */

// ── ViewBox constants (must match FacilityMapCampus.tsx) ─────────────────────
export const VB_W = 780;
export const VB_H = 540;

/** Minimum drag size (map pct) to treat a gesture as intentional. */
export const MIN_DRAG_PCT = 1;

// ── Lightweight interface ─────────────────────────────────────────────────────
// Only the two SVG methods we actually call, so tests can supply a plain
// object instead of a real SVGSVGElement.
export interface SvgPointSource {
  createSVGPoint(): {
    x: number;
    y: number;
    matrixTransform(m: DOMMatrixReadOnly): DOMPoint;
  };
  getScreenCTM(): DOMMatrix | null;
}

// ── Primary DOM conversion ────────────────────────────────────────────────────

/**
 * Convert pointer client coordinates to SVG viewBox coordinates.
 *
 * getScreenCTM() returns the cumulative transformation from SVG user space
 * to screen space, incorporating any CSS transforms on ancestor elements
 * (including the zoom/pan wrapper div) and the SVG's own viewBox/
 * preserveAspectRatio scaling.  Inverting it gives us screen → viewBox.
 *
 * Returns null when getScreenCTM() is unavailable (detached element).
 */
export function screenToSvgPoint(
  svgEl: SvgPointSource,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return null;
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const r = pt.matrixTransform(ctm.inverse());
  return { x: r.x, y: r.y };
}

// ── Pure math helpers ─────────────────────────────────────────────────────────

/** SVG viewBox coordinates → map-pct values. */
export function svgToPct(
  svgX: number,
  svgY: number,
  vbW: number = VB_W,
  vbH: number = VB_H,
): { x: number; y: number } {
  return { x: (svgX / vbW) * 100, y: (svgY / vbH) * 100 };
}

/** Map-pct values → SVG viewBox coordinates. */
export function pctToSvg(
  pctX: number,
  pctY: number,
  vbW: number = VB_W,
  vbH: number = VB_H,
): { x: number; y: number } {
  return { x: (pctX / 100) * vbW, y: (pctY / 100) * vbH };
}

/**
 * Combined: screen pointer → clamped map-pct.
 * Returns null if getScreenCTM() is unavailable.
 */
export function screenToPct(
  svgEl: SvgPointSource,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const svgPt = screenToSvgPoint(svgEl, clientX, clientY);
  if (!svgPt) return null;
  return {
    x: clampPct((svgPt.x / VB_W) * 100),
    y: clampPct((svgPt.y / VB_H) * 100),
  };
}

/** Clamp a single value to [0, 100]. */
export function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Build a geometrically valid rect from two corner points (any coord space).
 * Handles reverse-direction drags: second point above/left of first.
 */
export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/**
 * Clamp a map-pct rect to [0, 100]².
 * Adjusts x/y first, then trims width/height to prevent right/bottom overflow.
 */
export function clampRectPct(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number; width: number; height: number } {
  const x = clampPct(rect.x);
  const y = clampPct(rect.y);
  return {
    x,
    y,
    width:  clampPct(rect.x + rect.width)  - x,
    height: clampPct(rect.y + rect.height) - y,
  };
}

/**
 * Convert a map-pct point to building-relative zone-pct coordinates.
 *
 * Zone coords are stored as percentages of the parent building's box,
 * not of the whole map.
 */
export function mapPctToZonePct(
  mapPctX: number,
  mapPctY: number,
  building: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: ((mapPctX - building.x) / building.width)  * 100,
    y: ((mapPctY - building.y) / building.height) * 100,
  };
}

/**
 * Compute a building-relative zone rect from two map-pct drag points.
 * Both endpoints are clamped to the building boundary before normalising,
 * so the result always fits within [0, 100]² in zone-pct space.
 */
export function zoneDragRect(
  anchor:  { x: number; y: number },
  current: { x: number; y: number },
  building: { x: number; y: number; width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const bRight  = building.x + building.width;
  const bBottom = building.y + building.height;
  const clampB  = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const x1 = clampB(anchor.x,  building.x, bRight);
  const y1 = clampB(anchor.y,  building.y, bBottom);
  const x2 = clampB(current.x, building.x, bRight);
  const y2 = clampB(current.y, building.y, bBottom);

  const m = normalizeRect(x1, y1, x2, y2);
  return {
    x:      ((m.x      - building.x) / building.width)  * 100,
    y:      ((m.y      - building.y) / building.height) * 100,
    width:  (m.width   / building.width)  * 100,
    height: (m.height  / building.height) * 100,
  };
}

/**
 * Returns true when a drag rect meets the minimum intentional-drag threshold.
 */
export function isDragSignificant(rect: {
  width: number;
  height: number;
}): boolean {
  return rect.width >= MIN_DRAG_PCT && rect.height >= MIN_DRAG_PCT;
}

// ── Zone move / resize geometry helpers ──────────────────────────────────────

/**
 * Minimum zone dimension (zone-pct) enforced during resize.
 * 2% of the parent building's own dimension.
 */
export const MIN_ZONE_SIZE_PCT = 2;

/**
 * Compute the new zone-pct rect after a move drag.
 *
 * The drag delta is in map-pct; we convert it to zone-pct by dividing by the
 * building's own map-pct dimensions (which encode how large the building is
 * relative to the whole map).  The result is clamped so the zone stays
 * within [0, 100]² in zone-pct space (i.e. fully inside the building).
 */
export function computeMovedZoneRect(
  zoneRect: { x: number; y: number; width: number; height: number },
  buildingRect: { width: number; height: number },
  origin: { x: number; y: number },
  current: { x: number; y: number },
): { x: number; y: number; width: number; height: number } {
  // Convert map-pct delta to zone-pct delta.
  const dxZone = ((current.x - origin.x) / buildingRect.width)  * 100;
  const dyZone = ((current.y - origin.y) / buildingRect.height) * 100;
  const x = Math.max(0, Math.min(100 - zoneRect.width,  zoneRect.x + dxZone));
  const y = Math.max(0, Math.min(100 - zoneRect.height, zoneRect.y + dyZone));
  return { x, y, width: zoneRect.width, height: zoneRect.height };
}

/**
 * Compute the new zone-pct rect after a resize drag.
 *
 * Same 8-handle logic as the building resize, but deltas are first converted
 * from map-pct to zone-pct using the parent building's dimensions.
 * MIN_ZONE_SIZE_PCT is enforced, and the result is clamped to [0,100]².
 */
export function computeResizedZoneRect(
  zoneRect: { x: number; y: number; width: number; height: number },
  buildingRect: { width: number; height: number },
  handle: "nw" | "n" | "ne" | "e" | "w" | "se" | "s" | "sw",
  origin: { x: number; y: number },
  current: { x: number; y: number },
): { x: number; y: number; width: number; height: number } {
  const dx = ((current.x - origin.x) / buildingRect.width)  * 100;
  const dy = ((current.y - origin.y) / buildingRect.height) * 100;

  let { x, y, width, height } = zoneRect;

  if (handle === "e" || handle === "ne" || handle === "se") {
    width = Math.max(MIN_ZONE_SIZE_PCT, width + dx);
  }
  if (handle === "w" || handle === "nw" || handle === "sw") {
    const newW = Math.max(MIN_ZONE_SIZE_PCT, width - dx);
    x = x + (width - newW);
    width = newW;
  }
  if (handle === "s" || handle === "se" || handle === "sw") {
    height = Math.max(MIN_ZONE_SIZE_PCT, height + dy);
  }
  if (handle === "n" || handle === "ne" || handle === "nw") {
    const newH = Math.max(MIN_ZONE_SIZE_PCT, height - dy);
    y = y + (height - newH);
    height = newH;
  }

  // Clamp to zone-pct canvas [0, 100]²
  x      = Math.max(0, x);
  y      = Math.max(0, y);
  width  = Math.min(100 - x, width);
  height = Math.min(100 - y, height);

  return { x, y, width, height };
}

// ── Zone overlap detection ────────────────────────────────────────────────────

/**
 * Returns true if rectangle A and rectangle B overlap (share any area).
 *
 * Uses the standard axis-aligned separating-axis test:
 *   NOT (a_right ≤ b_left OR b_right ≤ a_left OR a_bottom ≤ b_top OR b_bottom ≤ a_top)
 *
 * Touching edges (e.g. a.x + a.width === b.x) are NOT considered an overlap —
 * zones that share only a boundary edge are allowed, since that is a legitimate
 * physical arrangement (one room immediately next to another).
 *
 * All coordinates are in the same space (zone-pct relative to the parent building).
 */
export function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Convert an SVG-space point (in the shared VB_W × VB_H viewBox) to a
 * building-relative percentage coordinate (0–100 on each axis).
 *
 * This is the inverse of `buildingToSvgRect` from FacilityMapCampus:
 *   svgX = building.x/100 * VB_W  +  pctX/100 * buildingW_svg
 *   →  pctX = (svgX - building.x/100*VB_W) / buildingW_svg * 100
 *
 * The result is clamped to [0, 100] so a drop that lands slightly outside
 * the building rect still produces a valid coordinate.
 *
 * @param svgX  X in SVG viewBox units
 * @param svgY  Y in SVG viewBox units
 * @param building  Building record (x, y, width, height all as map-pct 0–100)
 * @returns  { x, y } building-relative percentages, each clamped to [0, 100]
 */
export function svgPtToBuildingPct(
  svgX: number,
  svgY: number,
  building: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  const bx = (building.x / 100) * VB_W;
  const by = (building.y / 100) * VB_H;
  const bw = (building.width / 100) * VB_W;
  const bh = (building.height / 100) * VB_H;

  return {
    x: clampPct(((svgX - bx) / bw) * 100),
    y: clampPct(((svgY - by) / bh) * 100),
  };
}
