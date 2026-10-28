/**
 * useConfigDrag.ts
 *
 * Drag-state machine for the Facility Map configuration editor.
 *
 * Phases:
 *   idle           — default; no interaction in progress
 *   drawing        — user is dragging a new building rectangle (Batch 2-C)
 *   moving         — user is dragging an existing building to a new position (Batch 2-D)
 *   resizing       — user is dragging a resize handle on an existing building (Batch 2-D)
 *   zone-drawing   — user is dragging a new zone inside a selected building (Batch 2-E)
 *   zone-moving    — user is dragging an existing zone within its building (Batch 2-E)
 *   zone-resizing  — user is dragging a resize handle on an existing zone (Batch 2-E)
 *
 * Coordinate spaces:
 *   map-pct        0-100% relative to the whole canvas (buildings use this)
 *   zone-pct       0-100% relative to the parent building box (zones use this)
 *
 * The hook owns no SVG refs. Event handlers accept the SVG element explicitly
 * so that FacilityMapCampus controls the ref lifetime and tests can supply a
 * mock element without needing a DOM.
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  screenToPct,
  normalizeRect,
  clampRectPct,
  isDragSignificant,
  zoneDragRect,
  computeMovedZoneRect,
  computeResizedZoneRect,
  type SvgPointSource,
} from "../utils/coordinateHelpers";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum building dimension (map-pct) enforced during resize. */
const MIN_SIZE_PCT = 2;

/**
 * Minimum pct movement before onMoveComplete fires.
 * Prevents opening a draft when the user simply clicks a building to select it.
 */
const MIN_MOVE_PCT = 0.5;

// ── Types ─────────────────────────────────────────────────────────────────────

type MapPct = { x: number; y: number };

/** Resize handle identifier. */
export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "e"               | "w"
  | "se" | "s" | "sw";

export type GhostRect = { x: number; y: number; width: number; height: number };

export type DragState =
  | { phase: "idle" }
  | { phase: "drawing"; anchor: MapPct; current: MapPct }
  | { phase: "moving";   targetId: string; buildingRect: GhostRect; origin: MapPct; current: MapPct }
  | { phase: "resizing"; targetId: string; handle: ResizeHandle; buildingRect: GhostRect; origin: MapPct; current: MapPct }
  | { phase: "zone-drawing"; buildingId: string; buildingRect: GhostRect; anchor: MapPct; current: MapPct }
  | { phase: "zone-moving";  buildingId: string; buildingRect: GhostRect; zoneId: string; zoneRect: GhostRect; origin: MapPct; current: MapPct }
  | { phase: "zone-resizing"; buildingId: string; buildingRect: GhostRect; zoneId: string; handle: ResizeHandle; zoneRect: GhostRect; origin: MapPct; current: MapPct };

// ── Hook options ─────────────────────────────────────────────────────────────

export interface UseConfigDragOptions {
  /** Called when the user completes a building draw gesture of sufficient size. */
  onDrawComplete?: (rect: GhostRect) => void;
  /**
   * Called when the user completes a building move drag of sufficient distance.
   * NOT called when the building was merely clicked (tiny drag).
   */
  onMoveComplete?: (buildingId: string, rect: GhostRect) => void;
  /** Called when the user completes a building resize drag. Always fires. */
  onResizeComplete?: (buildingId: string, rect: GhostRect) => void;
  /**
   * Called when the user completes a zone draw gesture of sufficient size.
   * rect is in zone-pct space (relative to the parent building).
   */
  onZoneDrawComplete?: (buildingId: string, rect: GhostRect) => void;
  /**
   * Called when the user completes a zone move drag of sufficient distance.
   * rect is in zone-pct space.
   */
  onZoneMoveComplete?: (buildingId: string, zoneId: string, rect: GhostRect) => void;
  /** Called when the user completes a zone resize drag. rect is in zone-pct space. */
  onZoneResizeComplete?: (buildingId: string, zoneId: string, rect: GhostRect) => void;
}

// ── Hook return ───────────────────────────────────────────────────────────────

export interface UseConfigDragReturn {
  dragState: DragState;
  /** Normalised ghost rect in map-pct space during a building draw gesture. null otherwise. */
  ghostRect: GhostRect | null;
  /** Live draft rect in map-pct space during a building move or resize gesture. null otherwise. */
  editLiveRect: GhostRect | null;
  /** True while a building draw gesture is in progress. */
  isDrawing: boolean;
  /** Id of the building being moved or resized. null when in idle/drawing/zone phases. */
  editingTargetId: string | null;

  /** Ghost rect in zone-pct space during a zone draw gesture. null otherwise. */
  zoneGhostRect: GhostRect | null;
  /** Live draft rect in zone-pct space during a zone move or resize gesture. null otherwise. */
  zoneEditLiveRect: GhostRect | null;
  /** Id of the zone being moved or resized. null otherwise. */
  editingZoneId: string | null;
  /** Id of the building whose zone is being drawn/moved/resized. null otherwise. */
  editingZoneBuildingId: string | null;

  /** Call from the map wrapper div's onMouseDown when configMode is on and the user is NOT on a building/zone. */
  onConfigMouseDown: (e: React.MouseEvent, svgEl: SVGSVGElement) => void;
  /** Call from the map wrapper div's onMouseMove when configMode is on. */
  onConfigMouseMove: (e: React.MouseEvent, svgEl: SVGSVGElement) => void;
  /** Call from the map wrapper div's onMouseUp and onMouseLeave when configMode is on. */
  onConfigMouseUp: () => void;
  /** Reset drag state to idle immediately (Escape key handler). */
  cancelDrag: () => void;

  /** Start a building move gesture (call from building body onMouseDown, unselected building). */
  onMoveStart: (e: React.MouseEvent, svgEl: SVGSVGElement, buildingId: string, buildingRect: GhostRect) => void;
  /** Start a building resize gesture (call from building handle onMouseDown). */
  onResizeStart: (e: React.MouseEvent, svgEl: SVGSVGElement, buildingId: string, handle: ResizeHandle, buildingRect: GhostRect) => void;

  /** Start a zone draw gesture (call from selected building body onMouseDown). */
  onZoneDrawStart: (e: React.MouseEvent, svgEl: SVGSVGElement, buildingId: string, buildingRect: GhostRect) => void;
  /** Start a zone move gesture (call from zone body onMouseDown). */
  onZoneMoveStart: (e: React.MouseEvent, svgEl: SVGSVGElement, buildingId: string, buildingRect: GhostRect, zoneId: string, zoneRect: GhostRect) => void;
  /** Start a zone resize gesture (call from zone handle onMouseDown). */
  onZoneResizeStart: (e: React.MouseEvent, svgEl: SVGSVGElement, buildingId: string, buildingRect: GhostRect, zoneId: string, handle: ResizeHandle, zoneRect: GhostRect) => void;
}

// ── Building geometry helpers ─────────────────────────────────────────────────

/** Compute the new map-pct rect after a building move drag. Clamps to canvas [0,100]. */
function computeMovedRect(
  buildingRect: GhostRect,
  origin: MapPct,
  current: MapPct,
): GhostRect {
  const dx = current.x - origin.x;
  const dy = current.y - origin.y;
  const x = Math.max(0, Math.min(100 - buildingRect.width,  buildingRect.x + dx));
  const y = Math.max(0, Math.min(100 - buildingRect.height, buildingRect.y + dy));
  return { x, y, width: buildingRect.width, height: buildingRect.height };
}

/**
 * Compute the new map-pct rect after a building resize drag.
 * Enforces MIN_SIZE_PCT and clamps to canvas [0,100].
 */
function computeResizedRect(
  buildingRect: GhostRect,
  handle: ResizeHandle,
  origin: MapPct,
  current: MapPct,
): GhostRect {
  const dx = current.x - origin.x;
  const dy = current.y - origin.y;
  let { x, y, width, height } = buildingRect;

  if (handle === "e" || handle === "ne" || handle === "se") {
    width = Math.max(MIN_SIZE_PCT, width + dx);
  }
  if (handle === "w" || handle === "nw" || handle === "sw") {
    const newW = Math.max(MIN_SIZE_PCT, width - dx);
    x = x + (width - newW);
    width = newW;
  }
  if (handle === "s" || handle === "se" || handle === "sw") {
    height = Math.max(MIN_SIZE_PCT, height + dy);
  }
  if (handle === "n" || handle === "ne" || handle === "nw") {
    const newH = Math.max(MIN_SIZE_PCT, height - dy);
    y = y + (height - newH);
    height = newH;
  }

  x      = Math.max(0, x);
  y      = Math.max(0, y);
  width  = Math.min(100 - x, width);
  height = Math.min(100 - y, height);

  return { x, y, width, height };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConfigDrag(
  configMode: boolean,
  options: UseConfigDragOptions = {},
): UseConfigDragReturn {
  const {
    onDrawComplete,
    onMoveComplete,
    onResizeComplete,
    onZoneDrawComplete,
    onZoneMoveComplete,
    onZoneResizeComplete,
  } = options;

  const [dragState, setDragState] = useState<DragState>({ phase: "idle" });

  // Always return to idle when config mode is toggled off.
  useEffect(() => {
    if (!configMode) setDragState({ phase: "idle" });
  }, [configMode]);

  // ── Building drawing ──────────────────────────────────────────────────────

  const onConfigMouseDown = useCallback(
    (e: React.MouseEvent, svgEl: SVGSVGElement) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({ phase: "drawing", anchor: pct, current: pct });
    },
    [configMode],
  );

  // ── Building moving ───────────────────────────────────────────────────────

  const onMoveStart = useCallback(
    (
      e: React.MouseEvent,
      svgEl: SVGSVGElement,
      buildingId: string,
      buildingRect: GhostRect,
    ) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({
        phase: "moving",
        targetId: buildingId,
        buildingRect,
        origin: pct,
        current: pct,
      });
    },
    [configMode],
  );

  // ── Building resizing ─────────────────────────────────────────────────────

  const onResizeStart = useCallback(
    (
      e: React.MouseEvent,
      svgEl: SVGSVGElement,
      buildingId: string,
      handle: ResizeHandle,
      buildingRect: GhostRect,
    ) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({
        phase: "resizing",
        targetId: buildingId,
        handle,
        buildingRect,
        origin: pct,
        current: pct,
      });
    },
    [configMode],
  );

  // ── Zone drawing ──────────────────────────────────────────────────────────

  const onZoneDrawStart = useCallback(
    (
      e: React.MouseEvent,
      svgEl: SVGSVGElement,
      buildingId: string,
      buildingRect: GhostRect,
    ) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({ phase: "zone-drawing", buildingId, buildingRect, anchor: pct, current: pct });
    },
    [configMode],
  );

  // ── Zone moving ───────────────────────────────────────────────────────────

  const onZoneMoveStart = useCallback(
    (
      e: React.MouseEvent,
      svgEl: SVGSVGElement,
      buildingId: string,
      buildingRect: GhostRect,
      zoneId: string,
      zoneRect: GhostRect,
    ) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({
        phase: "zone-moving",
        buildingId,
        buildingRect,
        zoneId,
        zoneRect,
        origin: pct,
        current: pct,
      });
    },
    [configMode],
  );

  // ── Zone resizing ─────────────────────────────────────────────────────────

  const onZoneResizeStart = useCallback(
    (
      e: React.MouseEvent,
      svgEl: SVGSVGElement,
      buildingId: string,
      buildingRect: GhostRect,
      zoneId: string,
      handle: ResizeHandle,
      zoneRect: GhostRect,
    ) => {
      if (!configMode) return;
      const pct = screenToPct(svgEl as unknown as SvgPointSource, e.clientX, e.clientY);
      if (!pct) return;
      e.stopPropagation();
      setDragState({
        phase: "zone-resizing",
        buildingId,
        buildingRect,
        zoneId,
        handle,
        zoneRect,
        origin: pct,
        current: pct,
      });
    },
    [configMode],
  );

  // ── Mouse move — all active phases ────────────────────────────────────────

  const onConfigMouseMove = useCallback(
    (e: React.MouseEvent, svgEl: SVGSVGElement) => {
      setDragState((prev) => {
        if (
          prev.phase !== "drawing" &&
          prev.phase !== "moving" &&
          prev.phase !== "resizing" &&
          prev.phase !== "zone-drawing" &&
          prev.phase !== "zone-moving" &&
          prev.phase !== "zone-resizing"
        ) return prev;
        const pct = screenToPct(
          svgEl as unknown as SvgPointSource,
          e.clientX,
          e.clientY,
        );
        if (!pct) return prev;
        return { ...prev, current: pct };
      });
    },
    [],
  );

  // ── Mouse up — commit or discard ──────────────────────────────────────────

  const onConfigMouseUp = useCallback(() => {
    setDragState((prev) => {
      if (prev.phase === "drawing") {
        const rect = normalizeRect(
          prev.anchor.x, prev.anchor.y,
          prev.current.x, prev.current.y,
        );
        const clamped = clampRectPct(rect);
        if (isDragSignificant(clamped)) {
          setTimeout(() => onDrawComplete?.(clamped), 0);
        }
      } else if (prev.phase === "moving") {
        const delta = Math.hypot(
          prev.current.x - prev.origin.x,
          prev.current.y - prev.origin.y,
        );
        if (delta >= MIN_MOVE_PCT) {
          const newRect = computeMovedRect(prev.buildingRect, prev.origin, prev.current);
          setTimeout(() => onMoveComplete?.(prev.targetId, newRect), 0);
        }
      } else if (prev.phase === "resizing") {
        const newRect = computeResizedRect(
          prev.buildingRect, prev.handle, prev.origin, prev.current,
        );
        setTimeout(() => onResizeComplete?.(prev.targetId, newRect), 0);
      } else if (prev.phase === "zone-drawing") {
        const zoneRect = zoneDragRect(prev.anchor, prev.current, prev.buildingRect);
        if (isDragSignificant(zoneRect)) {
          const bId = prev.buildingId;
          setTimeout(() => onZoneDrawComplete?.(bId, zoneRect), 0);
        }
      } else if (prev.phase === "zone-moving") {
        const delta = Math.hypot(
          prev.current.x - prev.origin.x,
          prev.current.y - prev.origin.y,
        );
        if (delta >= MIN_MOVE_PCT) {
          const newRect = computeMovedZoneRect(
            prev.zoneRect, prev.buildingRect, prev.origin, prev.current,
          );
          const bId = prev.buildingId;
          const zId = prev.zoneId;
          setTimeout(() => onZoneMoveComplete?.(bId, zId, newRect), 0);
        }
      } else if (prev.phase === "zone-resizing") {
        const newRect = computeResizedZoneRect(
          prev.zoneRect, prev.buildingRect, prev.handle, prev.origin, prev.current,
        );
        const bId = prev.buildingId;
        const zId = prev.zoneId;
        setTimeout(() => onZoneResizeComplete?.(bId, zId, newRect), 0);
      }
      return { phase: "idle" };
    });
  }, [
    onDrawComplete, onMoveComplete, onResizeComplete,
    onZoneDrawComplete, onZoneMoveComplete, onZoneResizeComplete,
  ]);

  const cancelDrag = useCallback(() => {
    setDragState({ phase: "idle" });
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const ghostRect = useMemo<GhostRect | null>(() => {
    if (dragState.phase !== "drawing") return null;
    return normalizeRect(
      dragState.anchor.x, dragState.anchor.y,
      dragState.current.x, dragState.current.y,
    );
  }, [dragState]);

  const editLiveRect = useMemo<GhostRect | null>(() => {
    if (dragState.phase === "moving") {
      return computeMovedRect(dragState.buildingRect, dragState.origin, dragState.current);
    }
    if (dragState.phase === "resizing") {
      return computeResizedRect(
        dragState.buildingRect, dragState.handle, dragState.origin, dragState.current,
      );
    }
    return null;
  }, [dragState]);

  const editingTargetId = useMemo<string | null>(() => {
    if (dragState.phase === "moving" || dragState.phase === "resizing") {
      return dragState.targetId;
    }
    return null;
  }, [dragState]);

  const zoneGhostRect = useMemo<GhostRect | null>(() => {
    if (dragState.phase !== "zone-drawing") return null;
    return zoneDragRect(dragState.anchor, dragState.current, dragState.buildingRect);
  }, [dragState]);

  const zoneEditLiveRect = useMemo<GhostRect | null>(() => {
    if (dragState.phase === "zone-moving") {
      return computeMovedZoneRect(
        dragState.zoneRect, dragState.buildingRect, dragState.origin, dragState.current,
      );
    }
    if (dragState.phase === "zone-resizing") {
      return computeResizedZoneRect(
        dragState.zoneRect, dragState.buildingRect, dragState.handle,
        dragState.origin, dragState.current,
      );
    }
    return null;
  }, [dragState]);

  const editingZoneId = useMemo<string | null>(() => {
    if (dragState.phase === "zone-moving" || dragState.phase === "zone-resizing") {
      return dragState.zoneId;
    }
    return null;
  }, [dragState]);

  const editingZoneBuildingId = useMemo<string | null>(() => {
    if (
      dragState.phase === "zone-drawing" ||
      dragState.phase === "zone-moving" ||
      dragState.phase === "zone-resizing"
    ) {
      return dragState.buildingId;
    }
    return null;
  }, [dragState]);

  return {
    dragState,
    ghostRect,
    editLiveRect,
    isDrawing: dragState.phase === "drawing",
    editingTargetId,
    zoneGhostRect,
    zoneEditLiveRect,
    editingZoneId,
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
  };
}
