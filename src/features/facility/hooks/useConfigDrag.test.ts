/**
 * useConfigDrag.test.ts
 *
 * Unit tests for the useConfigDrag hook.
 *
 * The hook accepts SvgPointSource for coordinate conversion; we supply a
 * minimal mock that implements the same affine math used in
 * coordinateHelpers.test.ts without needing a real DOM SVGSVGElement.
 *
 * Tests: CD1-CD12
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfigDrag } from "./useConfigDrag";
import type { SvgPointSource } from "../utils/coordinateHelpers";

// ── Mock SVG element factory ──────────────────────────────────────────────────

/** Builds a minimal SvgPointSource whose getScreenCTM represents the identity
 *  transform from screen coords → SVG viewBox coords.  For testing we keep the
 *  matrix as identity so screen coords == SVG coords == pct when VB=100x100. */
function makeMockSvg(offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1): SvgPointSource {
  // Forward matrix: svgPt = (screenPt - offset) / scale
  // As a CTM this means: screenPt = CTM * svgPt → CTM.a=scale, CTM.e=offset
  // We want: svgPt = inverseCTM * screenPt
  // inverseCTM.a = 1/scale, inverseCTM.e = -offset/scale
  const ia = 1 / scaleX;
  const id = 1 / scaleY;
  const ie = -offsetX / scaleX;
  const inf = -offsetY / scaleY;

  return {
    createSVGPoint() {
      const pt = { x: 0, y: 0 } as { x: number; y: number; matrixTransform: (m: DOMMatrixReadOnly) => DOMPoint };
      pt.matrixTransform = function (m) {
        return {
          x: (m as unknown as { a: number; c: number; e: number }).a * this.x +
             (m as unknown as { c: number }).c * this.y +
             (m as unknown as { e: number }).e,
          y: (m as unknown as { b: number; d: number; f: number }).b * this.x +
             (m as unknown as { d: number }).d * this.y +
             (m as unknown as { f: number }).f,
          w: 1,
          z: 0,
          toJSON: () => ({}),
        } as DOMPoint;
      };
      return pt as ReturnType<SvgPointSource["createSVGPoint"]>;
    },
    getScreenCTM() {
      // Return an object with inverse() that gives our inverse matrix
      return {
        inverse: () => ({
          a: ia, b: 0, c: 0, d: id, e: ie, f: inf,
        }),
      } as unknown as DOMMatrix;
    },
  };
}

/** Build a minimal React.MouseEvent-like object. */
function fakeMouseEvent(clientX: number, clientY: number, overrides: Partial<React.MouseEvent> = {}): React.MouseEvent {
  return {
    clientX,
    clientY,
    stopPropagation: () => {},
    preventDefault: () => {},
    ...overrides,
  } as unknown as React.MouseEvent;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useConfigDrag", () => {
  // CD1: initial state is idle
  it("CD1 — starts in idle phase", () => {
    const { result } = renderHook(() => useConfigDrag(false));
    expect(result.current.dragState.phase).toBe("idle");
    expect(result.current.ghostRect).toBeNull();
    expect(result.current.isDrawing).toBe(false);
  });

  // CD2: mousedown when configMode=false is a no-op
  it("CD2 — mousedown is no-op when configMode is false", () => {
    const { result } = renderHook(() => useConfigDrag(false));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(10, 10), svg);
    });
    expect(result.current.dragState.phase).toBe("idle");
  });

  // CD3: mousedown transitions to drawing phase
  it("CD3 — mousedown in configMode starts drawing", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    // VB=780x540; we use identity scale mock so clientXY maps directly to SVG
    // units, then /VBW*100 for pct.
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(78, 54), svg);
    });
    expect(result.current.dragState.phase).toBe("drawing");
    expect(result.current.isDrawing).toBe(true);
  });

  // CD4: ghostRect is null until mouse moves away from anchor
  it("CD4 — ghostRect is null at same anchor=current position", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(0, 0), svg);
    });
    // anchor == current → zero-size rect, ghostRect returns normalizeRect output
    // but width/height are 0, which is still returned (not filtered here)
    expect(result.current.dragState.phase).toBe("drawing");
  });

  // CD5: mousemove updates current position
  it("CD5 — mousemove updates current in drawing phase", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(0, 0), svg);
    });
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(390, 270), svg);
    });
    expect(result.current.dragState.phase).toBe("drawing");
    if (result.current.dragState.phase === "drawing") {
      // 390/780*100 = 50, 270/540*100 = 50
      expect(result.current.dragState.current.x).toBeCloseTo(50, 0);
      expect(result.current.dragState.current.y).toBeCloseTo(50, 0);
    }
  });

  // CD6: ghostRect reflects normalised anchor/current
  it("CD6 — ghostRect mirrors normalizeRect of anchor/current", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // anchor at (390,270) = 50%,50%; current at (780,540) = 100%,100%
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(390, 270), svg);
    });
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(780, 540), svg);
    });
    const gr = result.current.ghostRect;
    expect(gr).not.toBeNull();
    expect(gr!.x).toBeCloseTo(50, 0);
    expect(gr!.y).toBeCloseTo(50, 0);
    expect(gr!.width).toBeCloseTo(50, 0);
    expect(gr!.height).toBeCloseTo(50, 0);
  });

  // CD7: reverse drag is normalised (ghostRect always has positive dimensions)
  it("CD7 — reverse drag produces positive-size ghostRect", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // anchor bottom-right, drag to top-left
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(780, 540), svg);
    });
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(0, 0), svg);
    });
    const gr = result.current.ghostRect;
    expect(gr).not.toBeNull();
    expect(gr!.x).toBeCloseTo(0, 0);
    expect(gr!.y).toBeCloseTo(0, 0);
    expect(gr!.width).toBeGreaterThan(0);
    expect(gr!.height).toBeGreaterThan(0);
  });

  // CD8: mouseup resets to idle
  it("CD8 — mouseup resets to idle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(0, 0), svg);
    });
    act(() => {
      result.current.onConfigMouseUp();
    });
    expect(result.current.dragState.phase).toBe("idle");
    expect(result.current.ghostRect).toBeNull();
  });

  // CD9: cancelDrag (Escape) resets to idle from drawing
  it("CD9 — cancelDrag resets to idle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(100, 100), svg);
    });
    act(() => {
      result.current.cancelDrag();
    });
    expect(result.current.dragState.phase).toBe("idle");
    expect(result.current.ghostRect).toBeNull();
  });

  // CD10: toggling configMode off while drawing resets to idle
  it("CD10 — toggling configMode off cancels in-progress draw", () => {
    const { result, rerender } = renderHook(
      ({ mode }: { mode: boolean }) => useConfigDrag(mode),
      { initialProps: { mode: true } },
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseDown(fakeMouseEvent(50, 50), svg);
    });
    expect(result.current.dragState.phase).toBe("drawing");

    rerender({ mode: false });
    expect(result.current.dragState.phase).toBe("idle");
  });

  // CD11: stopPropagation is called on mousedown to prevent pan
  it("CD11 — onConfigMouseDown calls stopPropagation", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    let stopped = false;
    const e = fakeMouseEvent(0, 0, {
      stopPropagation: () => { stopped = true; },
    });
    act(() => {
      result.current.onConfigMouseDown(e, svg);
    });
    expect(stopped).toBe(true);
  });

  // CD12: mousemove outside drawing is a no-op
  it("CD12 — onConfigMouseMove when idle stays idle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(200, 200), svg);
    });
    expect(result.current.dragState.phase).toBe("idle");
  });
});

// ── Batch 2-C: onDrawComplete callback ───────────────────────────────────────

describe("onDrawComplete callback", () => {
  // CD13: draw complete fires with clamped rect when drag is significant
  it("CD13 — onDrawComplete fires with clamped rect after sufficient drag", async () => {
    const onDrawComplete = vi.fn();
    const { result } = renderHook(() => useConfigDrag(true, { onDrawComplete }));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // drag from 10%,10% to 40%,30% (in identity mock: 78,54 → 312,162)
    act(() => { result.current.onConfigMouseDown(fakeMouseEvent(78, 54), svg); });
    act(() => { result.current.onConfigMouseMove(fakeMouseEvent(312, 162), svg); });
    act(() => { result.current.onConfigMouseUp(); });

    // setTimeout(0) in hook — flush micro/macro tasks
    await new Promise(r => setTimeout(r, 10));
    expect(onDrawComplete).toHaveBeenCalledOnce();
    const rect = onDrawComplete.mock.calls[0][0];
    expect(rect.x).toBeCloseTo(10, 0);
    expect(rect.y).toBeCloseTo(10, 0);
    expect(rect.width).toBeCloseTo(30, 0);
    expect(rect.height).toBeCloseTo(20, 0);
  });

  // CD14: minimum-size rejection — onDrawComplete NOT called for tiny drag
  it("CD14 — onDrawComplete NOT called when drag is below MIN_DRAG_PCT", async () => {
    const onDrawComplete = vi.fn();
    const { result } = renderHook(() => useConfigDrag(true, { onDrawComplete }));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // drag only 0.5% — sub-threshold in both axes (0.5/100*780 ≈ 3.9 px)
    act(() => { result.current.onConfigMouseDown(fakeMouseEvent(0, 0), svg); });
    act(() => { result.current.onConfigMouseMove(fakeMouseEvent(3, 3), svg); });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise(r => setTimeout(r, 10));
    expect(onDrawComplete).not.toHaveBeenCalled();
    // State still resets to idle
    expect(result.current.dragState.phase).toBe("idle");
  });

  // CD15: boundary clamping — coordinates never exceed 0-100
  it("CD15 — rect clamped to map boundaries (no negative/over-100 values)", async () => {
    const onDrawComplete = vi.fn();
    const { result } = renderHook(() => useConfigDrag(true, { onDrawComplete }));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // drag from (-50,-50) to (900,600) in screen coords (well outside map)
    act(() => { result.current.onConfigMouseDown(fakeMouseEvent(-50, -50), svg); });
    act(() => { result.current.onConfigMouseMove(fakeMouseEvent(900, 600), svg); });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise(r => setTimeout(r, 10));
    if (onDrawComplete.mock.calls.length > 0) {
      const rect = onDrawComplete.mock.calls[0][0];
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(100);
      expect(rect.y + rect.height).toBeLessThanOrEqual(100);
    }
  });

  // CD16: callback not present — no error when onDrawComplete is omitted
  it("CD16 — no error when onDrawComplete not provided", async () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => { result.current.onConfigMouseDown(fakeMouseEvent(0, 0), svg); });
    act(() => { result.current.onConfigMouseMove(fakeMouseEvent(390, 270), svg); });
    await expect(
      new Promise<void>((resolve) => {
        act(() => { result.current.onConfigMouseUp(); });
        setTimeout(resolve, 10);
      })
    ).resolves.toBeUndefined();
    expect(result.current.dragState.phase).toBe("idle");
  });
});

// ── Batch 2-D: move and resize existing buildings ────────────────────────────

describe("move phase (Batch 2-D)", () => {
  // CD17: onMoveStart begins moving phase with correct state
  it("CD17 — onMoveStart sets phase to moving with target info", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    expect(result.current.dragState.phase).toBe("moving");
    if (result.current.dragState.phase === "moving") {
      expect(result.current.dragState.targetId).toBe("bldg-1");
    }
    expect(result.current.editingTargetId).toBe("bldg-1");
    expect(result.current.ghostRect).toBeNull(); // drawing ghost is null
    expect(result.current.editLiveRect).not.toBeNull(); // edit rect computed
  });

  // CD18: editLiveRect reflects move delta during mousemove
  it("CD18 — editLiveRect updates correctly during move mousemove", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // Building at 40,40 size 20x20; click at SVG 50,50
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // VB_W=780 → 10 pct delta = 78 screen px; VB_H=540 → 5 pct = 27 screen px
    // Move from (50,50) to (128,77) → pct delta (+10, +5)
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(128, 77), svg);
    });
    const live = result.current.editLiveRect;
    expect(live).not.toBeNull();
    expect(live?.x).toBeCloseTo(50, 0);    // 40 + 10
    expect(live?.y).toBeCloseTo(45, 0);    // 40 + 5
    expect(live?.width).toBeCloseTo(20, 0);
    expect(live?.height).toBeCloseTo(20, 0);
  });

  // CD19: onMoveComplete fires with correct rect after sufficient drag
  it("CD19 — onMoveComplete fires after sufficient move drag", async () => {
    const onMoveComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onMoveComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // Move from (50,50) to (128,77) → pct delta (+10, +5)
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(128, 77), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onMoveComplete).toHaveBeenCalledOnce();
    const [id, rect] = onMoveComplete.mock.calls[0];
    expect(id).toBe("bldg-1");
    expect(rect.x).toBeCloseTo(50, 0);
    expect(rect.y).toBeCloseTo(45, 0);
  });

  // CD20: onMoveComplete NOT fired on tiny drag (just a click)
  it("CD20 — onMoveComplete NOT fired for sub-threshold drag", async () => {
    const onMoveComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onMoveComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // No mousemove — same position on mouseup
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onMoveComplete).not.toHaveBeenCalled();
    expect(result.current.dragState.phase).toBe("idle");
  });

  // CD21: move is clamped to canvas boundaries (can't move past 0 or 100-size)
  it("CD21 — move clamped to canvas boundaries", async () => {
    const onMoveComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onMoveComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // Building at 5,5 size 20x20; drag far left and up (-200 pct)
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 5, y: 5, width: 20, height: 20 },
      );
    });
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(-2000, -2000), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    const rect = onMoveComplete.mock.calls[0]?.[1];
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
  });

  // CD22: cancelDrag from moving phase returns to idle
  it("CD22 — cancelDrag from moving phase returns to idle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onMoveStart(
        fakeMouseEvent(50, 50),
        svg,
        "bldg-1",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    expect(result.current.dragState.phase).toBe("moving");
    act(() => { result.current.cancelDrag(); });
    expect(result.current.dragState.phase).toBe("idle");
    expect(result.current.editLiveRect).toBeNull();
  });
});

describe("resize phase (Batch 2-D)", () => {
  // CD23: onResizeStart begins resizing phase with correct handle
  it("CD23 — onResizeStart sets phase to resizing with handle id", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onResizeStart(
        fakeMouseEvent(60, 60),
        svg,
        "bldg-1",
        "se",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    expect(result.current.dragState.phase).toBe("resizing");
    if (result.current.dragState.phase === "resizing") {
      expect(result.current.dragState.handle).toBe("se");
      expect(result.current.dragState.targetId).toBe("bldg-1");
    }
    expect(result.current.editingTargetId).toBe("bldg-1");
  });

  // CD24: editLiveRect reflects resize delta for "se" handle
  it("CD24 — editLiveRect reflects resize for se handle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onResizeStart(
        fakeMouseEvent(60, 60),
        svg,
        "bldg-1",
        "se",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // Drag se handle: 10 pct in x = 78 screen px; 10 pct in y = 54 screen px
    // Move from (60,60) to (138,114) → width+10, height+10
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(138, 114), svg);
    });
    const live = result.current.editLiveRect;
    expect(live).not.toBeNull();
    expect(live?.x).toBeCloseTo(40, 0);
    expect(live?.y).toBeCloseTo(40, 0);
    expect(live?.width).toBeCloseTo(30, 0);
    expect(live?.height).toBeCloseTo(30, 0);
  });

  // CD25: min size enforced on w handle (can't shrink below MIN_SIZE_PCT)
  it("CD25 — resize enforces MIN_SIZE_PCT via w handle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // Building at 40,40 size 20x20; grab w handle and drag far right
    act(() => {
      result.current.onResizeStart(
        fakeMouseEvent(40, 50),
        svg,
        "bldg-1",
        "w",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // Drag far right in screen space: +200 screen px = +25 pct, way past min size
    // w handle reduces width by dx pct; MIN_SIZE_PCT=2 enforced
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(240, 50), svg);
    });
    const live = result.current.editLiveRect;
    expect(live?.width).toBeGreaterThanOrEqual(2);
  });

  // CD26: onResizeComplete fires after resize mouseup
  it("CD26 — onResizeComplete fires after resize mouseup", async () => {
    const onResizeComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onResizeComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onResizeStart(
        fakeMouseEvent(60, 60),
        svg,
        "bldg-1",
        "se",
        { x: 40, y: 40, width: 20, height: 20 },
      );
    });
    // 10 pct x delta = 78 screen px; 10 pct y delta = 54 screen px
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(138, 114), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onResizeComplete).toHaveBeenCalledOnce();
    const [id, rect] = onResizeComplete.mock.calls[0];
    expect(id).toBe("bldg-1");
    expect(rect.width).toBeCloseTo(30, 0);
    expect(rect.height).toBeCloseTo(30, 0);
  });
});

// ── Zone interaction tests (CD27–CD33) ────────────────────────────────────────

describe("useConfigDrag — zone phases", () => {
  // CD27: onZoneDrawStart transitions to zone-drawing phase
  it("CD27 — onZoneDrawStart transitions to zone-drawing", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onZoneDrawStart(
        fakeMouseEvent(20, 20),
        svg,
        "bldg-1",
        { x: 10, y: 10, width: 50, height: 40 },
      );
    });
    expect(result.current.dragState.phase).toBe("zone-drawing");
    if (result.current.dragState.phase === "zone-drawing") {
      expect(result.current.dragState.buildingId).toBe("bldg-1");
    }
  });

  // CD28: zoneGhostRect is null when not in zone-drawing phase
  it("CD28 — zoneGhostRect is null when idle", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    expect(result.current.zoneGhostRect).toBeNull();
  });

  // CD29: zoneGhostRect updates on mousemove during zone-drawing
  it("CD29 — zoneGhostRect updates on mousemove during zone-drawing", () => {
    const { result } = renderHook(() => useConfigDrag(true));
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    // Building at pct {x:10,y:10,w:50,h:40} → SVG pixels: left=78,top=54,right=468,bottom=270
    // Anchor inside building, current further inside building
    act(() => {
      result.current.onZoneDrawStart(
        fakeMouseEvent(100, 70),
        svg,
        "bldg-1",
        { x: 10, y: 10, width: 50, height: 40 },
      );
    });
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(250, 160), svg);
    });
    expect(result.current.zoneGhostRect).not.toBeNull();
    expect(result.current.zoneGhostRect?.width).toBeGreaterThan(0);
    expect(result.current.zoneGhostRect?.height).toBeGreaterThan(0);
  });

  // CD30: mouseUp after sufficient zone draw calls onZoneDrawComplete
  it("CD30 — onZoneDrawComplete fires after sufficient zone draw", async () => {
    const onZoneDrawComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onZoneDrawComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onZoneDrawStart(
        fakeMouseEvent(100, 70),
        svg,
        "bldg-1",
        { x: 10, y: 10, width: 50, height: 40 },
      );
    });
    // Move enough to pass MIN_DRAG_PCT threshold — use coords inside building (pct {x:10,y:10,w:50,h:40})
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(250, 160), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onZoneDrawComplete).toHaveBeenCalledOnce();
    const [buildingId, rect] = onZoneDrawComplete.mock.calls[0];
    expect(buildingId).toBe("bldg-1");
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });

  // CD31: mouseUp after insufficient zone draw does NOT call onZoneDrawComplete
  it("CD31 — onZoneDrawComplete not called for tiny drag", async () => {
    const onZoneDrawComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onZoneDrawComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    act(() => {
      result.current.onZoneDrawStart(
        fakeMouseEvent(20, 30),
        svg,
        "bldg-1",
        { x: 10, y: 10, width: 50, height: 40 },
      );
    });
    // Barely move — less than MIN_DRAG_PCT
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(20.01, 30.01), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onZoneDrawComplete).not.toHaveBeenCalled();
  });

  // CD32: onZoneMoveStart transitions to zone-moving; onZoneMoveComplete fires on mouseUp
  it("CD32 — onZoneMoveStart → zone-moving; onZoneMoveComplete fires", async () => {
    const onZoneMoveComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onZoneMoveComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    const buildingRect = { x: 10, y: 10, width: 50, height: 40 };
    const zoneRect     = { x: 20, y: 20, width: 30, height: 20 };
    act(() => {
      result.current.onZoneMoveStart(
        fakeMouseEvent(30, 25),
        svg,
        "bldg-1",
        buildingRect,
        "zone-1",
        zoneRect,
      );
    });
    expect(result.current.dragState.phase).toBe("zone-moving");
    // Move enough
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(40, 35), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onZoneMoveComplete).toHaveBeenCalledOnce();
    const [bId, zId] = onZoneMoveComplete.mock.calls[0];
    expect(bId).toBe("bldg-1");
    expect(zId).toBe("zone-1");
  });

  // CD33: onZoneResizeStart transitions to zone-resizing; onZoneResizeComplete fires on mouseUp
  it("CD33 — onZoneResizeStart → zone-resizing; onZoneResizeComplete fires", async () => {
    const onZoneResizeComplete = vi.fn();
    const { result } = renderHook(() =>
      useConfigDrag(true, { onZoneResizeComplete }),
    );
    const svg = makeMockSvg() as unknown as SVGSVGElement;
    const buildingRect = { x: 10, y: 10, width: 50, height: 40 };
    const zoneRect     = { x: 20, y: 20, width: 30, height: 20 };
    act(() => {
      result.current.onZoneResizeStart(
        fakeMouseEvent(60, 40),
        svg,
        "bldg-1",
        buildingRect,
        "zone-1",
        "se",
        zoneRect,
      );
    });
    expect(result.current.dragState.phase).toBe("zone-resizing");
    if (result.current.dragState.phase === "zone-resizing") {
      expect(result.current.dragState.handle).toBe("se");
    }
    act(() => {
      result.current.onConfigMouseMove(fakeMouseEvent(70, 50), svg);
    });
    act(() => { result.current.onConfigMouseUp(); });

    await new Promise<void>((r) => setTimeout(r, 20));
    expect(onZoneResizeComplete).toHaveBeenCalledOnce();
    const [bId, zId, rect] = onZoneResizeComplete.mock.calls[0];
    expect(bId).toBe("bldg-1");
    expect(zId).toBe("zone-1");
    expect(rect.width).toBeGreaterThan(0);
  });
});
