/**
 * coordinateHelpers.test.ts
 *
 * Unit tests for the facility map coordinate helper functions.
 *
 * Strategy:
 *  – screenToSvgPoint depends on SVGSVGElement.getScreenCTM() which jsdom
 *    does not implement.  We supply a minimal mock that satisfies the
 *    SvgPointSource interface and encodes a specific affine matrix so we can
 *    assert exact values.
 *  – All other helpers are pure functions; no mocking required.
 *
 * Matrix convention used by SVG / DOMMatrix (column-major 2D affine):
 *
 *   x' = a·x + c·y + e
 *   y' = b·x + d·y + f
 *
 * Inverse of [a,b,c,d,e,f]:
 *   det = a·d – b·c
 *   inv = [ d/det, -b/det, -c/det, a/det,
 *           (b·f – d·e)/det, (c·e – a·f)/det ]
 */

import { describe, it, expect } from "vitest";
import {
  VB_W,
  VB_H,
  MIN_DRAG_PCT,
  screenToSvgPoint,
  svgToPct,
  pctToSvg,
  screenToPct,
  clampPct,
  normalizeRect,
  clampRectPct,
  mapPctToZonePct,
  zoneDragRect,
  isDragSignificant,
  type SvgPointSource,
  svgPtToBuildingPct,
} from "./coordinateHelpers";

// ── Mock factory ──────────────────────────────────────────────────────────────

interface AffineMatrix {
  a: number; b: number;
  c: number; d: number;
  e: number; f: number;
}

/** Build a mock SVG element whose getScreenCTM() returns the given matrix. */
function mockSvg(fwd: AffineMatrix): SvgPointSource {
  const det = fwd.a * fwd.d - fwd.b * fwd.c;
  const inv: AffineMatrix = {
    a:  fwd.d / det,
    b: -fwd.b / det,
    c: -fwd.c / det,
    d:  fwd.a / det,
    e: (fwd.b * fwd.f - fwd.d * fwd.e) / det,
    f: (fwd.c * fwd.e - fwd.a * fwd.f) / det,
  };

  return {
    createSVGPoint() {
      const pt = { x: 0, y: 0 } as {
        x: number;
        y: number;
        matrixTransform(m: AffineMatrix): { x: number; y: number };
      };
      pt.matrixTransform = function (m: AffineMatrix) {
        return {
          x: m.a * this.x + m.c * this.y + m.e,
          y: m.b * this.x + m.d * this.y + m.f,
        };
      };
      return pt as ReturnType<SvgPointSource["createSVGPoint"]>;
    },
    getScreenCTM() {
      return {
        inverse: () => inv as unknown as DOMMatrix,
      } as unknown as DOMMatrix;
    },
  };
}

/** Build a mock SVG element whose getScreenCTM() returns null. */
function mockSvgNull(): SvgPointSource {
  return {
    createSVGPoint() {
      return {} as ReturnType<SvgPointSource["createSVGPoint"]>;
    },
    getScreenCTM() {
      return null;
    },
  };
}

// Helpers for float comparisons
const PREC = 8; // decimal places
const near = (a: number, b: number) => expect(a).toBeCloseTo(b, PREC);

// ── screenToSvgPoint ──────────────────────────────────────────────────────────

describe("screenToSvgPoint", () => {
  it("identity matrix: pointer equals viewBox coordinate", () => {
    // SVG at screen origin, 1:1 pixel mapping
    const svg = mockSvg({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    const result = screenToSvgPoint(svg, 390, 270);
    expect(result).not.toBeNull();
    near(result!.x, 390);
    near(result!.y, 270);
  });

  it("SVG offset from screen origin (e,f translate in CTM)", () => {
    // SVG rendered at screen (100, 50); no scaling
    const svg = mockSvg({ a: 1, b: 0, c: 0, d: 1, e: 100, f: 50 });
    const result = screenToSvgPoint(svg, 490, 320);
    expect(result).not.toBeNull();
    near(result!.x, 390); // 490 - 100
    near(result!.y, 270); // 320 - 50
  });

  it("uniform scale 2x (SVG rendered at double size)", () => {
    // Scale factor 2: viewBox unit = 2 screen pixels.
    // CTM forward: x_screen = 2 * x_vb + e  →  a=2, d=2, e=0, f=0
    const svg = mockSvg({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
    // Screen point (780, 540) = bottom-right corner of viewBox at 2x scale
    const result = screenToSvgPoint(svg, 780, 540);
    expect(result).not.toBeNull();
    near(result!.x, 390); // 780/2
    near(result!.y, 270); // 540/2
  });

  it("CSS zoom=2 on wrapper div (scale encoded in CTM)", () => {
    // Browser folds the CSS transform into getScreenCTM().
    // Forward matrix: scale 2 centred at screen origin + offset (10, 20)
    // x_screen = 2*x_vb + 10,  y_screen = 2*y_vb + 20
    const svg = mockSvg({ a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 });
    // Pointer at (400, 290) in screen space
    const result = screenToSvgPoint(svg, 400, 290);
    expect(result).not.toBeNull();
    near(result!.x, (400 - 10) / 2); // 195
    near(result!.y, (290 - 20) / 2); // 135
  });

  it("non-uniform scale (aspect-ratio letterboxing)", () => {
    // viewBox 780×540 rendered into a 780×300 container;
    // xMidYMid meet → uniform scale = 300/540 ≈ 0.5556
    // Pillar-box offset e = (780 - 780*0.5556)/2 ≈ 173.3
    const s = 300 / 540;
    const eOff = (780 - 780 * s) / 2; // ≈ 173.33
    const svg = mockSvg({ a: s, b: 0, c: 0, d: s, e: eOff, f: 0 });
    // Screen centre: x=780/2=390, y=300/2=150
    const result = screenToSvgPoint(svg, 390, 150);
    expect(result).not.toBeNull();
    // After inverse: x_vb = (390 - eOff)/s ≈ 390; y_vb ≈ 270
    near(result!.x, 390);
    near(result!.y, 270);
  });

  it("returns null when getScreenCTM() returns null", () => {
    const svg = mockSvgNull();
    expect(screenToSvgPoint(svg, 0, 0)).toBeNull();
  });
});

// ── svgToPct ─────────────────────────────────────────────────────────────────

describe("svgToPct", () => {
  it("origin maps to 0, 0", () => {
    const r = svgToPct(0, 0);
    near(r.x, 0);
    near(r.y, 0);
  });

  it("bottom-right corner maps to 100, 100", () => {
    const r = svgToPct(VB_W, VB_H);
    near(r.x, 100);
    near(r.y, 100);
  });

  it("centre maps to 50, 50", () => {
    const r = svgToPct(VB_W / 2, VB_H / 2);
    near(r.x, 50);
    near(r.y, 50);
  });

  it("quarter point", () => {
    const r = svgToPct(195, 135);
    near(r.x, 25);
    near(r.y, 25);
  });

  it("accepts custom viewBox dimensions", () => {
    const r = svgToPct(50, 25, 200, 100);
    near(r.x, 25);
    near(r.y, 25);
  });
});

// ── pctToSvg ─────────────────────────────────────────────────────────────────

describe("pctToSvg", () => {
  it("0% maps to (0,0)", () => {
    const r = pctToSvg(0, 0);
    near(r.x, 0);
    near(r.y, 0);
  });

  it("100% maps to viewBox dimensions", () => {
    const r = pctToSvg(100, 100);
    near(r.x, VB_W);
    near(r.y, VB_H);
  });

  it("is inverse of svgToPct", () => {
    const svgX = 312, svgY = 189;
    const pct = svgToPct(svgX, svgY);
    const back = pctToSvg(pct.x, pct.y);
    near(back.x, svgX);
    near(back.y, svgY);
  });
});

// ── screenToPct ──────────────────────────────────────────────────────────────

describe("screenToPct", () => {
  it("maps screen centre to 50, 50 (no transform)", () => {
    const svg = mockSvg({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    const r = screenToPct(svg, VB_W / 2, VB_H / 2);
    expect(r).not.toBeNull();
    near(r!.x, 50);
    near(r!.y, 50);
  });

  it("clamps negative viewBox coords to 0", () => {
    // Pointer above/left of the SVG → negative viewBox coords
    const svg = mockSvg({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    const r = screenToPct(svg, -50, -30);
    expect(r).not.toBeNull();
    expect(r!.x).toBe(0);
    expect(r!.y).toBe(0);
  });

  it("clamps beyond-viewBox coords to 100", () => {
    const svg = mockSvg({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    const r = screenToPct(svg, VB_W + 200, VB_H + 100);
    expect(r).not.toBeNull();
    expect(r!.x).toBe(100);
    expect(r!.y).toBe(100);
  });

  it("returns null when getScreenCTM() returns null", () => {
    expect(screenToPct(mockSvgNull(), 0, 0)).toBeNull();
  });
});

// ── clampPct ─────────────────────────────────────────────────────────────────

describe("clampPct", () => {
  it("passes through values in range", () => expect(clampPct(50)).toBe(50));
  it("clamps below 0 to 0",           () => expect(clampPct(-10)).toBe(0));
  it("clamps above 100 to 100",       () => expect(clampPct(150)).toBe(100));
  it("passes through 0 exactly",      () => expect(clampPct(0)).toBe(0));
  it("passes through 100 exactly",    () => expect(clampPct(100)).toBe(100));
});

// ── normalizeRect ─────────────────────────────────────────────────────────────

describe("normalizeRect", () => {
  it("normal direction: top-left to bottom-right", () => {
    const r = normalizeRect(10, 20, 60, 80);
    expect(r).toEqual({ x: 10, y: 20, width: 50, height: 60 });
  });

  it("reverse X: drag right-to-left", () => {
    const r = normalizeRect(60, 20, 10, 80);
    expect(r).toEqual({ x: 10, y: 20, width: 50, height: 60 });
  });

  it("reverse Y: drag bottom-to-top", () => {
    const r = normalizeRect(10, 80, 60, 20);
    expect(r).toEqual({ x: 10, y: 20, width: 50, height: 60 });
  });

  it("both reversed: drag bottom-right to top-left", () => {
    const r = normalizeRect(60, 80, 10, 20);
    expect(r).toEqual({ x: 10, y: 20, width: 50, height: 60 });
  });

  it("zero-size rect (click, not drag)", () => {
    const r = normalizeRect(30, 30, 30, 30);
    expect(r).toEqual({ x: 30, y: 30, width: 0, height: 0 });
  });
});

// ── clampRectPct ──────────────────────────────────────────────────────────────

describe("clampRectPct", () => {
  it("passes through a valid in-bounds rect", () => {
    expect(clampRectPct({ x: 10, y: 20, width: 40, height: 30 }))
      .toEqual({ x: 10, y: 20, width: 40, height: 30 });
  });

  it("clamps x below 0", () => {
    const r = clampRectPct({ x: -10, y: 0, width: 20, height: 20 });
    expect(r.x).toBe(0);
    // right edge was at 10; after clamp x=0 width must be 10
    expect(r.width).toBe(10);
  });

  it("trims width when right edge exceeds 100", () => {
    const r = clampRectPct({ x: 90, y: 0, width: 20, height: 10 });
    expect(r.x).toBe(90);
    expect(r.width).toBe(10); // 100 - 90
  });

  it("trims height when bottom edge exceeds 100", () => {
    const r = clampRectPct({ x: 0, y: 85, width: 10, height: 30 });
    expect(r.y).toBe(85);
    expect(r.height).toBe(15); // 100 - 85
  });

  it("fully out of bounds on both axes returns zero dims", () => {
    const r = clampRectPct({ x: 110, y: 110, width: 10, height: 10 });
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });
});

// ── mapPctToZonePct ───────────────────────────────────────────────────────────

describe("mapPctToZonePct", () => {
  const building = { x: 10, y: 20, width: 40, height: 30 };

  it("top-left corner of building → zone (0, 0)", () => {
    const r = mapPctToZonePct(10, 20, building);
    near(r.x, 0);
    near(r.y, 0);
  });

  it("bottom-right corner of building → zone (100, 100)", () => {
    const r = mapPctToZonePct(50, 50, building);
    near(r.x, 100);
    near(r.y, 100);
  });

  it("centre of building → zone (50, 50)", () => {
    const r = mapPctToZonePct(30, 35, building);
    near(r.x, 50);
    near(r.y, 50);
  });

  it("quarter point within building", () => {
    const r = mapPctToZonePct(20, 27.5, building);
    near(r.x, 25);
    near(r.y, 25);
  });
});

// ── zoneDragRect ──────────────────────────────────────────────────────────────

describe("zoneDragRect", () => {
  const building = { x: 10, y: 20, width: 40, height: 30 };

  it("normal drag: anchor=TL corner, current=BR corner → full zone 0,0,100,100", () => {
    const r = zoneDragRect({ x: 10, y: 20 }, { x: 50, y: 50 }, building);
    near(r.x, 0);
    near(r.y, 0);
    near(r.width, 100);
    near(r.height, 100);
  });

  it("quarter drag from TL → 50% zone at origin", () => {
    const r = zoneDragRect({ x: 10, y: 20 }, { x: 30, y: 35 }, building);
    near(r.x, 0);
    near(r.y, 0);
    near(r.width, 50);
    near(r.height, 50);
  });

  it("reverse drag: bottom-right to top-left still produces positive dims", () => {
    const r = zoneDragRect({ x: 50, y: 50 }, { x: 10, y: 20 }, building);
    near(r.width, 100);
    near(r.height, 100);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
  });

  it("anchor outside building is clamped to building edge", () => {
    // anchor far above the building
    const r = zoneDragRect({ x: 10, y: -50 }, { x: 30, y: 35 }, building);
    // clamped anchor y becomes building.y=20 → zone.y=0
    near(r.y, 0);
    expect(r.height).toBeGreaterThan(0);
  });

  it("current point outside building is clamped to building edge", () => {
    // current x overflows building right edge (50)
    const r = zoneDragRect({ x: 10, y: 20 }, { x: 999, y: 50 }, building);
    near(r.width, 100); // clamped to full building width
  });

  it("zone stays within [0,100] when both points are fully outside", () => {
    const r = zoneDragRect({ x: -100, y: -100 }, { x: 999, y: 999 }, building);
    near(r.x, 0);
    near(r.y, 0);
    near(r.width, 100);
    near(r.height, 100);
  });
});

// ── isDragSignificant ─────────────────────────────────────────────────────────

describe("isDragSignificant", () => {
  it("returns true when both dims meet the threshold", () => {
    expect(isDragSignificant({ width: MIN_DRAG_PCT, height: MIN_DRAG_PCT })).toBe(true);
    expect(isDragSignificant({ width: 5, height: 5 })).toBe(true);
  });

  it("returns false when width is below threshold", () => {
    expect(isDragSignificant({ width: 0, height: 5 })).toBe(false);
    expect(isDragSignificant({ width: MIN_DRAG_PCT - 0.1, height: 5 })).toBe(false);
  });

  it("returns false when height is below threshold", () => {
    expect(isDragSignificant({ width: 5, height: 0 })).toBe(false);
  });

  it("returns false for zero-size (click, not drag)", () => {
    expect(isDragSignificant({ width: 0, height: 0 })).toBe(false);
  });
});

// ── computeMovedZoneRect ──────────────────────────────────────────────────────

import { computeMovedZoneRect, computeResizedZoneRect, MIN_ZONE_SIZE_PCT } from "./coordinateHelpers";

describe("computeMovedZoneRect", () => {
  const zone     = { x: 20, y: 20, width: 30, height: 25 };
  const building = { width: 40, height: 30 };

  it("no drag delta — rect unchanged", () => {
    const r = computeMovedZoneRect(zone, building, { x: 50, y: 50 }, { x: 50, y: 50 });
    expect(r).toMatchObject({ x: 20, y: 20, width: 30, height: 25 });
  });

  it("positive x delta — zone moves right in zone-pct space", () => {
    // dx map-pct = 4 → dx zone-pct = (4/40)*100 = 10
    const r = computeMovedZoneRect(zone, building, { x: 50, y: 50 }, { x: 54, y: 50 });
    expect(r.x).toBeCloseTo(30, 4);
    expect(r.y).toBeCloseTo(20, 4);
    expect(r.width).toBe(zone.width);
    expect(r.height).toBe(zone.height);
  });

  it("negative y delta — zone moves up", () => {
    // dy map-pct = -3 → dy zone-pct = (-3/30)*100 = -10
    const r = computeMovedZoneRect(zone, building, { x: 50, y: 50 }, { x: 50, y: 47 });
    expect(r.x).toBeCloseTo(20, 4);
    expect(r.y).toBeCloseTo(10, 4);
  });

  it("zone cannot move past left edge (x clamped to 0)", () => {
    // Zone starts at x=5; drag left by 20 pct in map → 50 in zone-pct; should clamp to 0
    const z = { x: 5, y: 20, width: 30, height: 25 };
    const r = computeMovedZoneRect(z, building, { x: 50, y: 50 }, { x: 42, y: 50 });
    expect(r.x).toBeGreaterThanOrEqual(0);
  });

  it("zone cannot move past right edge (x+width clamped to 100)", () => {
    // Zone at x=70 width=20; drag right pushes past 100
    const z = { x: 70, y: 20, width: 20, height: 25 };
    const r = computeMovedZoneRect(z, building, { x: 50, y: 50 }, { x: 90, y: 50 });
    expect(r.x + r.width).toBeLessThanOrEqual(100);
  });

  it("zone cannot move past bottom edge", () => {
    const z = { x: 20, y: 75, width: 20, height: 20 };
    const r = computeMovedZoneRect(z, building, { x: 50, y: 50 }, { x: 50, y: 90 });
    expect(r.y + r.height).toBeLessThanOrEqual(100);
  });

  it("size is preserved after move", () => {
    const r = computeMovedZoneRect(zone, building, { x: 50, y: 50 }, { x: 54, y: 53 });
    expect(r.width).toBe(zone.width);
    expect(r.height).toBe(zone.height);
  });
});

// ── computeResizedZoneRect ────────────────────────────────────────────────────

describe("computeResizedZoneRect", () => {
  const zone     = { x: 20, y: 20, width: 30, height: 30 };
  const building = { width: 40, height: 40 };

  it("e handle increases width", () => {
    // dx = 4 map-pct → (4/40)*100 = 10 zone-pct added to width
    const r = computeResizedZoneRect(zone, building, "e", { x: 50, y: 50 }, { x: 54, y: 50 });
    expect(r.width).toBeCloseTo(40, 4);
    expect(r.x).toBeCloseTo(20, 4);
  });

  it("w handle decreases width and adjusts x", () => {
    // dx = 4 map-pct → 10 zone-pct; w handle subtracts from width, adds to x
    const r = computeResizedZoneRect(zone, building, "w", { x: 50, y: 50 }, { x: 54, y: 50 });
    expect(r.width).toBeCloseTo(20, 4);
    expect(r.x).toBeCloseTo(30, 4);
  });

  it("s handle increases height", () => {
    const r = computeResizedZoneRect(zone, building, "s", { x: 50, y: 50 }, { x: 50, y: 54 });
    expect(r.height).toBeCloseTo(40, 4);
    expect(r.y).toBeCloseTo(20, 4);
  });

  it("n handle decreases height and adjusts y", () => {
    const r = computeResizedZoneRect(zone, building, "n", { x: 50, y: 50 }, { x: 50, y: 54 });
    expect(r.height).toBeCloseTo(20, 4);
    expect(r.y).toBeCloseTo(30, 4);
  });

  it("se handle grows both dimensions", () => {
    const r = computeResizedZoneRect(zone, building, "se", { x: 50, y: 50 }, { x: 54, y: 54 });
    expect(r.width).toBeCloseTo(40, 4);
    expect(r.height).toBeCloseTo(40, 4);
  });

  it("nw handle shrinks both and adjusts origin", () => {
    const r = computeResizedZoneRect(zone, building, "nw", { x: 50, y: 50 }, { x: 54, y: 54 });
    expect(r.width).toBeCloseTo(20, 4);
    expect(r.height).toBeCloseTo(20, 4);
    expect(r.x).toBeCloseTo(30, 4);
    expect(r.y).toBeCloseTo(30, 4);
  });

  it("enforces MIN_ZONE_SIZE_PCT on width when shrinking past minimum", () => {
    // Huge drag on w handle should not collapse width below 2
    const r = computeResizedZoneRect(zone, building, "e", { x: 50, y: 50 }, { x: 10, y: 50 });
    expect(r.width).toBeGreaterThanOrEqual(MIN_ZONE_SIZE_PCT);
  });

  it("enforces MIN_ZONE_SIZE_PCT on height when shrinking past minimum", () => {
    const r = computeResizedZoneRect(zone, building, "s", { x: 50, y: 50 }, { x: 50, y: 10 });
    expect(r.height).toBeGreaterThanOrEqual(MIN_ZONE_SIZE_PCT);
  });

  it("result is clamped to zone-pct [0,100]²", () => {
    // Huge drag on se should not exceed 100
    const r = computeResizedZoneRect(zone, building, "se", { x: 50, y: 50 }, { x: 999, y: 999 });
    expect(r.x + r.width).toBeLessThanOrEqual(100);
    expect(r.y + r.height).toBeLessThanOrEqual(100);
  });

  it("ne handle: grows width + shrinks height from top", () => {
    const r = computeResizedZoneRect(zone, building, "ne", { x: 50, y: 50 }, { x: 54, y: 46 });
    expect(r.width).toBeGreaterThan(zone.width);
    expect(r.height).toBeGreaterThan(zone.height);
    expect(r.y).toBeLessThan(zone.y);
  });

  it("sw handle: drag right-down → shrinks width from left + grows height", () => {
    // SW handle: dragging RIGHT (dx>0) shrinks the w-side (x increases, width decreases)
    //            dragging DOWN  (dy>0) grows the s-side (height increases)
    // dx = (54-50)/40 * 100 = 10 zone-pct → newW = max(2, 30-10) = 20, x = 20+(30-20) = 30
    // dy = (54-50)/40 * 100 = 10 zone-pct → height = max(2, 30+10) = 40
    const r = computeResizedZoneRect(zone, building, "sw", { x: 50, y: 50 }, { x: 54, y: 54 });
    expect(r.width).toBeCloseTo(20, 4);
    expect(r.x).toBeCloseTo(30, 4);
    expect(r.height).toBeCloseTo(40, 4);
  });
});

// ── rectanglesOverlap tests (RO01–RO10) ──────────────────────────────────────

import { rectanglesOverlap } from "./coordinateHelpers";

describe("rectanglesOverlap", () => {
  const r = (x: number, y: number, w: number, h: number) => ({ x, y, width: w, height: h });

  // RO01: identical rects overlap
  it("RO01: identical rectangles overlap", () => {
    expect(rectanglesOverlap(r(10, 10, 30, 30), r(10, 10, 30, 30))).toBe(true);
  });

  // RO02: one fully inside the other
  it("RO02: rect fully inside another overlaps", () => {
    expect(rectanglesOverlap(r(10, 10, 60, 60), r(20, 20, 20, 20))).toBe(true);
  });

  // RO03: partial overlap (quadrant)
  it("RO03: partial overlap (quadrant intersection)", () => {
    expect(rectanglesOverlap(r(0, 0, 40, 40), r(30, 30, 40, 40))).toBe(true);
  });

  // RO04: touching right edge only — NOT an overlap
  it("RO04: rects sharing only right/left edge do not overlap", () => {
    // a right edge at x=40, b left edge at x=40 → touch, not overlap
    expect(rectanglesOverlap(r(0, 0, 40, 40), r(40, 0, 40, 40))).toBe(false);
  });

  // RO05: touching bottom edge only — NOT an overlap
  it("RO05: rects sharing only bottom/top edge do not overlap", () => {
    expect(rectanglesOverlap(r(0, 0, 40, 40), r(0, 40, 40, 40))).toBe(false);
  });

  // RO06: entirely to the left — no overlap
  it("RO06: rect entirely to the left does not overlap", () => {
    expect(rectanglesOverlap(r(0, 0, 20, 20), r(25, 0, 20, 20))).toBe(false);
  });

  // RO07: entirely above — no overlap
  it("RO07: rect entirely above does not overlap", () => {
    expect(rectanglesOverlap(r(0, 0, 20, 20), r(0, 25, 20, 20))).toBe(false);
  });

  // RO08: touching corner only — NOT an overlap
  it("RO08: rects sharing only a corner do not overlap", () => {
    expect(rectanglesOverlap(r(0, 0, 30, 30), r(30, 30, 30, 30))).toBe(false);
  });

  // RO09: large zone overlapping small zone (Refectory-style out-of-bounds zone)
  it("RO09: a zone in the lower-right still overlaps a zone that started inside", () => {
    // existing zone: x=20,y=20 w=40,h=40  → right=60, bottom=60
    // new zone: x=50,y=50 w=30,h=30       → overlaps at (50-60)x(50-60)
    expect(rectanglesOverlap(r(20, 20, 40, 40), r(50, 50, 30, 30))).toBe(true);
  });

  // RO10: commutative — order of arguments does not matter
  it("RO10: overlap check is commutative", () => {
    const a = r(10, 10, 30, 30);
    const b = r(25, 25, 30, 30);
    expect(rectanglesOverlap(a, b)).toBe(rectanglesOverlap(b, a));
  });
});

// ---------------------------------------------------------------------------
// svgPtToBuildingPct — Phase 3 camera-placement coordinate helper
// ---------------------------------------------------------------------------

describe("svgPtToBuildingPct", () => {
  // A building occupying the top-left quadrant of the map-pct space
  // (50% wide, 50% tall, starting at origin).
  // In SVG units: x=0, y=0, width=390, height=270  (VB_W=780, VB_H=540)
  const building = { x: 0, y: 0, width: 50, height: 50 };

  // SB01: SVG origin maps to building-pct (0, 0)
  it("SB01: SVG origin maps to building-pct (0, 0)", () => {
    expect(svgPtToBuildingPct(0, 0, building)).toEqual({ x: 0, y: 0 });
  });

  // SB02: bottom-right corner of the building rect → (100, 100)
  it("SB02: bottom-right corner of building rect maps to (100, 100)", () => {
    // bw = 50/100 * 780 = 390, bh = 50/100 * 540 = 270
    expect(svgPtToBuildingPct(390, 270, building)).toEqual({ x: 100, y: 100 });
  });

  // SB03: centre of the building rect → (50, 50)
  it("SB03: centre of building rect maps to (50, 50)", () => {
    expect(svgPtToBuildingPct(195, 135, building)).toEqual({ x: 50, y: 50 });
  });

  // SB04: building at non-zero offset
  it("SB04: building offset from origin — origin of building maps to pct (0, 0)", () => {
    // building at map-pct x=25,y=25,width=50,height=50
    // SVG origin of building: x=25/100*780=195, y=25/100*540=135
    const b = { x: 25, y: 25, width: 50, height: 50 };
    expect(svgPtToBuildingPct(195, 135, b)).toEqual({ x: 0, y: 0 });
  });

  // SB05: point beyond building right edge clamps to x=100
  it("SB05: SVG point beyond right edge clamps x to 100", () => {
    const result = svgPtToBuildingPct(500, 135, building); // 500 > 390
    expect(result.x).toBe(100);
  });

  // SB06: point above building top edge clamps to y=0
  it("SB06: SVG point above top edge clamps y to 0", () => {
    const result = svgPtToBuildingPct(195, -10, building);
    expect(result.y).toBe(0);
  });

  // SB07: result values are numbers (not NaN) even on zero-size building
  it("SB07: zero-size building still returns clamped numbers", () => {
    const b = { x: 50, y: 50, width: 0, height: 0 };
    const result = svgPtToBuildingPct(200, 200, b);
    // division by zero → Infinity → clampPct returns 100
    expect(Number.isFinite(result.x) || result.x === 0 || result.x === 100).toBe(true);
    expect(Number.isFinite(result.y) || result.y === 0 || result.y === 100).toBe(true);
  });

  // SB08: round-trip — buildingPct → SVG → buildingPct is identity
  it("SB08: round-trip through buildingToSvgRect inverse is identity", () => {
    const b = { x: 10, y: 20, width: 40, height: 30 };
    const targetX = 42.5;
    const targetY = 17.8;
    // Forward: pct → SVG
    const svgX = (b.x / 100) * 780 + (targetX / 100) * ((b.width / 100) * 780);
    const svgY = (b.y / 100) * 540 + (targetY / 100) * ((b.height / 100) * 540);
    // Inverse:
    const { x, y } = svgPtToBuildingPct(svgX, svgY, b);
    expect(x).toBeCloseTo(targetX, 8);
    expect(y).toBeCloseTo(targetY, 8);
  });
});
