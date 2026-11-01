import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FacilityMapCampus, {
  buildingToSvgRect,
  zoneToSvgRect,
} from "./FacilityMapCampus";
import type { FacilityBuilding } from "../api/facility.types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const VB_W = 780;
const VB_H = 540;

function makeBuilding(overrides: Partial<FacilityBuilding> = {}): FacilityBuilding {
  return {
    id: "b1",
    name: "Main Building",
    x: 10,
    y: 10,
    width: 30,
    height: 20,
    unzoned_cameras_total: 0,
    created_at: null,
    zones: [],
    ...overrides,
  };
}

const DEFAULT_PROPS = {
  buildings: [],
  layers: {
    cameras: true,
    zones: true,
    "building-labels": true,
    perimeter: true,
    "access-points": true,
    alerts: true,
  } as Record<string, boolean>,
  zoneFilter: "all",
  selectedCameraId: null,
  selectedBuildingId: null,
  onSelectCamera: vi.fn(),
  onSelectBuilding: vi.fn(),
};

// ── Coordinate helper tests ───────────────────────────────────────────────────

describe("buildingToSvgRect", () => {
  it("FM1 — converts 0% to SVG origin", () => {
    const r = buildingToSvgRect({ x: 0, y: 0, width: 0, height: 0 });
    expect(r).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it("FM2 — converts 100% to full viewBox", () => {
    const r = buildingToSvgRect({ x: 0, y: 0, width: 100, height: 100 });
    expect(r).toEqual({ x: 0, y: 0, width: VB_W, height: VB_H });
  });

  it("FM3 — converts partial percentages correctly", () => {
    const r = buildingToSvgRect({ x: 50, y: 25, width: 20, height: 10 });
    expect(r.x).toBeCloseTo(390);
    expect(r.y).toBeCloseTo(135);
    expect(r.width).toBeCloseTo(156);
    expect(r.height).toBeCloseTo(54);
  });
});

describe("zoneToSvgRect", () => {
  it("FM4 — zone at 0,0 fills top-left of building", () => {
    const b = { x: 10, y: 10, width: 20, height: 10 };
    const z = { x: 0, y: 0, width: 50, height: 50 };
    const br = buildingToSvgRect(b);
    const zr = zoneToSvgRect(b, z);
    expect(zr.x).toBeCloseTo(br.x);
    expect(zr.y).toBeCloseTo(br.y);
    expect(zr.width).toBeCloseTo(br.width * 0.5);
    expect(zr.height).toBeCloseTo(br.height * 0.5);
  });

  it("FM5 — zone at 50,50 starts at centre of building", () => {
    const b = { x: 0, y: 0, width: 100, height: 100 };
    const z = { x: 50, y: 50, width: 50, height: 50 };
    const zr = zoneToSvgRect(b, z);
    expect(zr.x).toBeCloseTo(VB_W * 0.5);
    expect(zr.y).toBeCloseTo(VB_H * 0.5);
  });
});

// ── Overlay state tests ───────────────────────────────────────────────────────

describe("FacilityMapCampus overlay states", () => {
  it("FM6 — shows loading spinner when isLoading=true", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} isLoading />);
    expect(screen.getByRole("status", { name: /loading map/i })).toBeTruthy();
    expect(screen.getByText(/loading map/i)).toBeTruthy();
  });

  it("FM7 — hides spinner when isLoading=false", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    expect(screen.queryByRole("status", { name: /loading map/i })).toBeNull();
  });

  it("FM8 — shows error overlay when isError=true and not loading", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} isError />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/failed to load map data/i)).toBeTruthy();
  });

  it("FM9 — Retry button calls onRetry", () => {
    const onRetry = vi.fn();
    render(<FacilityMapCampus {...DEFAULT_PROPS} isError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("FM10 — no Retry button when onRetry not provided", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} isError />);
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  it("FM11 — shows empty message when buildings=[] and not loading/error", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[]} />);
    expect(screen.getByText(/no buildings configured yet/i)).toBeTruthy();
  });

  it("FM12 — error overlay takes precedence over empty state", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[]} isError />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByText(/no buildings configured yet/i)).toBeNull();
  });
});

// ── Building rendering tests ──────────────────────────────────────────────────

describe("building rendering", () => {
  it("FM13 — renders building name label", () => {
    const b = makeBuilding({ name: "Alpha Wing" });
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[b]} />);
    expect(screen.getAllByText("Alpha Wing").length).toBeGreaterThan(0);
  });

  it("FM14 — clicking building calls onSelectBuilding", () => {
    const onSelectBuilding = vi.fn();
    const b = makeBuilding({ id: "bldg-99" });
    render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        onSelectBuilding={onSelectBuilding}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: b.name }));
    expect(onSelectBuilding).toHaveBeenCalledWith("bldg-99");
  });

  it("FM15 — renders camera count in label", () => {
    const b = makeBuilding({
      unzoned_cameras_total: 3,
      zones: [
        {
          id: "z1", name: "Z1", x: 0, y: 0, width: 50, height: 50,
          cameras_total: 2, cameras_online: 1, cameras: [],
        },
      ],
    });
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[b]} />);
    expect(screen.getByText(/5 cameras/i)).toBeTruthy();
  });
});

// ── Zone rendering tests ──────────────────────────────────────────────────────

describe("zone rendering", () => {
  it("FM16 — zones layer toggled off hides zone rects", () => {
    const b = makeBuilding({
      zones: [
        {
          id: "z1", name: "Zone A", x: 5, y: 5, width: 30, height: 30,
          cameras_total: 0, cameras_online: 0, cameras: [],
        },
      ],
    });
    const layers = { ...DEFAULT_PROPS.layers, zones: false };
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} buildings={[b]} layers={layers} />
    );
    // No dashed zone rect should be present (only building rect)
    // Zone rects use dasharray "4,3"; unmatched building rects use "6,3" — only check zone dashes are absent
    const dashedRects = container.querySelectorAll('rect[stroke-dasharray="4,3"]');
    expect(dashedRects.length).toBe(0);
  });
});

// ── Camera marker tests ───────────────────────────────────────────────────────

describe("camera markers", () => {
  function makeBuilding2WithCam() {
    return makeBuilding({
      zones: [
        {
          id: "z1", name: "Zone A", x: 0, y: 0, width: 100, height: 100,
          cameras_total: 1, cameras_online: 1,
          cameras: [{ id: "cam-1", label: "CAM-01", type: "fixed", feed_status: "live" }],
        },
      ],
    });
  }

  it("FM17 — camera marker rendered with aria-label", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[makeBuilding2WithCam()]} />);
    expect(screen.getByRole("button", { name: "CAM-01" })).toBeTruthy();
  });

  it("FM18 — clicking camera marker calls onSelectCamera", () => {
    const onSelectCamera = vi.fn();
    render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[makeBuilding2WithCam()]}
        onSelectCamera={onSelectCamera}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "CAM-01" }));
    expect(onSelectCamera).toHaveBeenCalledWith("cam-1");
  });

  it("FM19 — cameras layer off hides camera markers", () => {
    const layers = { ...DEFAULT_PROPS.layers, cameras: false };
    render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[makeBuilding2WithCam()]}
        layers={layers}
      />
    );
    expect(screen.queryByRole("button", { name: "CAM-01" })).toBeNull();
  });
});

// ── Zone filter tests ─────────────────────────────────────────────────────────

describe("zone filter", () => {
  it("FM20 — zoneFilter='all' shows all buildings", () => {
    const buildings = [
      makeBuilding({ id: "b1", name: "Building A" }),
      makeBuilding({ id: "b2", name: "Building B", x: 60 }),
    ];
    render(
      <FacilityMapCampus {...DEFAULT_PROPS} buildings={buildings} zoneFilter="all" />
    );
    expect(screen.getAllByText("Building A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Building B").length).toBeGreaterThan(0);
  });

  it("FM21 — zoneFilter='b1' shows only building b1", () => {
    const buildings = [
      makeBuilding({ id: "b1", name: "Building A" }),
      makeBuilding({ id: "b2", name: "Building B", x: 60 }),
    ];
    render(
      <FacilityMapCampus {...DEFAULT_PROPS} buildings={buildings} zoneFilter="b1" />
    );
    expect(screen.getAllByText("Building A").length).toBeGreaterThan(0);
    expect(screen.queryByText("Building B")).toBeNull();
  });
});

// ── Layer toggle tests ────────────────────────────────────────────────────────

describe("layer toggles", () => {
  it("FM22 — building-labels off hides building name text", () => {
    const b = makeBuilding({ name: "Hidden Wing" });
    const layers = { ...DEFAULT_PROPS.layers, "building-labels": false };
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[b]} layers={layers} />);
    expect(screen.queryByText("Hidden Wing")).toBeNull();
  });
});

// ── B1: Coordinate-based positioning (no name-based polygon override) ─────────

describe("B1 — coordinate-based building positioning", () => {
  it("FM23 — building named 'Building A' renders as interactive rect at stored coords, not a static polygon", () => {
    // In the old code, 'Building A' matched bldg-a polygon (hardcoded coords ignored stored x/y).
    // In the new code it renders as a rect driven by stored x/y/width/height.
    const b = makeBuilding({ id: "uuid-bldg-a", name: "Building A", x: 5, y: 5, width: 10, height: 10 });
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} buildings={[b]} />
    );
    // Must be interactive (role=button) — not swallowed by campus artwork
    const btn = screen.getByRole("button", { name: "Building A" });
    expect(btn).toBeTruthy();

    // Verify rect inside the interactive g has stored-coordinate dimensions
    // x = (5/100)*780 = 39, y = (5/100)*540 = 27, w = (10/100)*780 = 78, h = (10/100)*540 = 54
    const rects = container.querySelectorAll(`g[aria-label="Building A"] rect`);
    const mainRect = Array.from(rects).find((r) => {
      const x = parseFloat(r.getAttribute("x") ?? "0");
      return Math.abs(x - 39) < 1;
    });
    expect(mainRect).toBeTruthy();
  });

  it("FM24 — campus artwork polygon group is non-interactive (aria-hidden)", () => {
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} buildings={[makeBuilding()]} />
    );
    // The static artwork group has aria-hidden="true"
    const hiddenGroups = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenGroups.length).toBeGreaterThan(0);
    // The artwork group contains polygon elements (the floor-plan shapes)
    const hasPolygons = Array.from(hiddenGroups).some((g) =>
      g.querySelectorAll("polygon").length > 0
    );
    expect(hasPolygons).toBe(true);
  });

  it("FM25 — two buildings with different names both render as interactive rects", () => {
    const buildings = [
      makeBuilding({ id: "b1", name: "Building A", x: 5, y: 5, width: 10, height: 10 }),
      makeBuilding({ id: "b2", name: "Building B", x: 60, y: 5, width: 10, height: 10 }),
    ];
    render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={buildings} />);
    expect(screen.getByRole("button", { name: "Building A" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Building B" })).toBeTruthy();
  });
});

// ── Config mode tests ─────────────────────────────────────────────────────────

describe("config mode", () => {
  it("FM26 — config toolbar is hidden when configMode is off (default)", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    // Default configMode = false, toolbar should not be present
    expect(screen.queryByTestId("config-mode-toolbar")).toBeNull();
  });

  it("FM27 — config toolbar is visible when configMode=true", () => {
    render(<FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />);
    const toolbar = screen.getByTestId("config-mode-toolbar");
    expect(toolbar).toBeTruthy();
    // aria-label indicates config is active
    expect(toolbar.getAttribute("aria-label")).toMatch(/configuration/i);
  });

  it("FM28 — building click is suppressed in config mode", () => {
    const onSelectBuilding = vi.fn();
    const b = makeBuilding({ id: "b1", name: "Block A" });
    // In config mode onClick is undefined, so the <g> loses role="button".
    // Query by aria-label and fire a click — callback must stay silent.
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        onSelectBuilding={onSelectBuilding}
        configMode={true}
      />
    );
    const group = container.querySelector('[aria-label="Block A"]');
    expect(group).not.toBeNull();
    fireEvent.click(group!);
    expect(onSelectBuilding).not.toHaveBeenCalled();
  });

  it("FM29 — building click fires normally when configMode=false", () => {
    const onSelectBuilding = vi.fn();
    const b = makeBuilding({ id: "b1", name: "Block A" });
    render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        onSelectBuilding={onSelectBuilding}
        configMode={false}
      />
    );
    const btn = screen.getByRole("button", { name: "Block A" });
    fireEvent.click(btn);
    expect(onSelectBuilding).toHaveBeenCalledWith("b1");
  });

  it("FM30 — ghost rect is absent when not dragging", () => {
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />
    );
    expect(container.querySelector('[data-testid="ghost-rect"]')).toBeNull();
  });
});

// ── Batch 2-C: draw-to-create campus tests ────────────────────────────────────

describe("draw-to-create (Batch 2-C)", () => {
  // FM31 — ghost rect label absent when not drawing
  it("FM31 — ghost rect dimension label absent when configMode off", () => {
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} configMode={false} />
    );
    expect(container.querySelector('[data-testid="ghost-rect-label"]')).toBeNull();
  });

  // FM32 — ghost rect group absent before any drag
  it("FM32 — ghost-rect-group absent before drag in config mode", () => {
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />
    );
    expect(container.querySelector('[data-testid="ghost-rect-group"]')).toBeNull();
  });

  // FM33 — onDrawComplete prop passes through to FacilityMapCampus without error
  it("FM33 — FacilityMapCampus accepts onDrawComplete prop without rendering error", () => {
    const onDrawComplete = vi.fn();
    expect(() =>
      render(
        <FacilityMapCampus
          {...DEFAULT_PROPS}
          configMode={true}
          onDrawComplete={onDrawComplete}
        />
      )
    ).not.toThrow();
  });

  // FM34 — building selection suppressed AND map stays in config mode
  it("FM34 — click on building in config mode never fires onSelectBuilding", () => {
    const onSelectBuilding = vi.fn();
    const b = makeBuilding({ id: "bx", name: "Config Test Bldg" });
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        onSelectBuilding={onSelectBuilding}
        configMode={true}
      />
    );
    const group = container.querySelector('[aria-label="Config Test Bldg"]');
    expect(group).not.toBeNull();
    fireEvent.click(group!);
    expect(onSelectBuilding).not.toHaveBeenCalled();
  });
});

// ── Zoom / Navigation fix tests ───────────────────────────────────────────────

describe("zoom and navigation (Zoom Fix)", () => {
  // Helper: get zoom-control buttons
  function getZoomControls() {
    const zoomIn  = screen.getByTitle("Zoom in");
    const zoomOut = screen.getByTitle("Zoom out");
    const reset   = screen.getByTitle("Reset view");
    return { zoomIn, zoomOut, reset };
  }

  // Helper: extract current transform string from .fm-map-inner
  function getTransform(container: HTMLElement): string {
    const inner = container.querySelector(".fm-map-inner") as HTMLElement;
    return inner?.style.transform ?? "";
  }

  // Helper: parse scale from transform string "translate(Xpx,Ypx) scale(Z)"
  function parseScale(transform: string): number {
    const m = transform.match(/scale\(([^)]+)\)/);
    return m ? parseFloat(m[1]) : NaN;
  }

  // Helper: parse pan from transform string
  function parsePan(transform: string): { x: number; y: number } {
    const m = transform.match(/translate\(([^p]+)px,([^p]+)px\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: NaN, y: NaN };
  }

  // ZM1 — initial transform is translate(0px,0px) scale(1)
  it("ZM1 — initial transform is identity (scale 1, pan 0,0)", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const t = getTransform(container);
    expect(parseScale(t)).toBeCloseTo(1, 3);
    const { x, y } = parsePan(t);
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  // ZM2 — zoom in button increases scale
  it("ZM2 — zoom-in button increases scale", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    const scale = parseScale(getTransform(container));
    expect(scale).toBeGreaterThan(1);
  });

  // ZM3 — zoom out button decreases scale
  it("ZM3 — zoom-out button decreases scale", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomOut } = getZoomControls();
    fireEvent.click(zoomOut);
    const scale = parseScale(getTransform(container));
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThan(0); // sanity: still positive
  });

  // ZM4 — reset restores scale to 1 and pan to 0,0 after zoom
  it("ZM4 — reset after zoom-in restores scale=1 and pan=0,0", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomIn, reset } = getZoomControls();
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(reset);
    const t = getTransform(container);
    expect(parseScale(t)).toBeCloseTo(1, 3);
    const { x, y } = parsePan(t);
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  // ZM5 — reset restores from zoom-out as well
  it("ZM5 — reset after zoom-out restores scale=1 and pan=0,0", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomOut, reset } = getZoomControls();
    fireEvent.click(zoomOut);
    fireEvent.click(reset);
    const t = getTransform(container);
    expect(parseScale(t)).toBeCloseTo(1, 3);
    const { x, y } = parsePan(t);
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  // ZM6 — zoom-in adjusts pan toward centre (pan is non-zero after zoom at non-zero clientWidth)
  it("ZM6 — zoom-in from default updates pan proportional to viewport centre", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    // jsdom getBoundingClientRect() returns zeros; simulate viewport size
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    const { x, y } = parsePan(getTransform(container));
    // With cx=400, cy=300 and zoom going from 1→1.3:
    // x = 400 - (400 - 0) * 1.3/1 = 400 - 520 = -120
    // y = 300 - (300 - 0) * 1.3/1 = 300 - 390 = -90
    expect(x).toBeCloseTo(-120, 0);
    expect(y).toBeCloseTo(-90, 0);
  });

  // ZM7 — zoom-out adjusts pan toward centre (inverse of ZM6)
  it("ZM7 — zoom-out from default updates pan proportional to viewport centre", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    // jsdom getBoundingClientRect() returns zeros; simulate viewport size
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
    const { zoomOut } = getZoomControls();
    fireEvent.click(zoomOut);
    const scale = parseScale(getTransform(container));
    // scale = 1/1.3 ≈ 0.769
    expect(scale).toBeCloseTo(1 / 1.3, 3);
    const { x, y } = parsePan(getTransform(container));
    // x = 400 - (400 - 0) * (1/1.3)/1 = 400 - 400*(1/1.3) ≈ 400 - 307.7 ≈ 92.3
    // y = 300 - (300 - 0) * (1/1.3)/1 ≈ 300 - 230.8 ≈ 69.2
    expect(x).toBeCloseTo(400 * (1 - 1/1.3), 0);
    expect(y).toBeCloseTo(300 * (1 - 1/1.3), 0);
  });

  // ZM8 — zoom-in clamps at MAX_ZOOM (4)
  it("ZM8 — repeated zoom-in clamps at MAX_ZOOM=4", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomIn } = getZoomControls();
    for (let i = 0; i < 20; i++) fireEvent.click(zoomIn);
    expect(parseScale(getTransform(container))).toBeCloseTo(4, 2);
  });

  // ZM9 — zoom-out clamps at MIN_ZOOM (0.6)
  it("ZM9 — repeated zoom-out clamps at MIN_ZOOM=0.6", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomOut } = getZoomControls();
    for (let i = 0; i < 20; i++) fireEvent.click(zoomOut);
    expect(parseScale(getTransform(container))).toBeCloseTo(0.6, 2);
  });

  // ZM10 — at MAX_ZOOM, additional zoom-in does not change pan (no jump)
  it("ZM10 — zoom-in at MAX_ZOOM limit leaves pan unchanged", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomIn } = getZoomControls();
    for (let i = 0; i < 25; i++) fireEvent.click(zoomIn);
    const pan1 = parsePan(getTransform(container));
    fireEvent.click(zoomIn); // already at max
    const pan2 = parsePan(getTransform(container));
    expect(pan2.x).toBeCloseTo(pan1.x, 3);
    expect(pan2.y).toBeCloseTo(pan1.y, 3);
  });

  // ZM11 — at MIN_ZOOM, additional zoom-out does not change pan (no jump)
  it("ZM11 — zoom-out at MIN_ZOOM limit leaves pan unchanged", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomOut } = getZoomControls();
    for (let i = 0; i < 25; i++) fireEvent.click(zoomOut);
    const pan1 = parsePan(getTransform(container));
    fireEvent.click(zoomOut); // already at min
    const pan2 = parsePan(getTransform(container));
    expect(pan2.x).toBeCloseTo(pan1.x, 3);
    expect(pan2.y).toBeCloseTo(pan1.y, 3);
  });

  // ZM12 — zoom in monitoring mode does not affect configMode prop
  it("ZM12 — zoom controls work the same in monitoring mode (configMode=false)", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} configMode={false} />);
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    expect(parseScale(getTransform(container))).toBeGreaterThan(1);
  });

  // ZM13 — zoom controls work the same in config mode (configMode=true)
  it("ZM13 — zoom controls work the same in config mode (configMode=true)", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />);
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    expect(parseScale(getTransform(container))).toBeGreaterThan(1);
  });

  // ZM14 — pan+zoom combination: zoom after pan preserves pan offset proportionally
  it("ZM14 — zoom-in after pan adjusts pan around viewport centre, not origin", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    // jsdom getBoundingClientRect() returns zeros; simulate viewport size
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

    // Simulate a pan of 50px right, 30px down via mousedown + mousemove
    fireEvent.mouseDown(container.querySelector(".fm-map-wrap")!, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(container.querySelector(".fm-map-wrap")!, { clientX: 50, clientY: 30 });
    fireEvent.mouseUp(container.querySelector(".fm-map-wrap")!);

    const afterPan = parsePan(getTransform(container));
    // pan should be approximately {x:50, y:30}
    expect(afterPan.x).toBeCloseTo(50, 0);
    expect(afterPan.y).toBeCloseTo(30, 0);

    const scaleBefore = parseScale(getTransform(container));
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);

    const scaleAfter = parseScale(getTransform(container));
    const panAfter   = parsePan(getTransform(container));
    // New pan = cx - (cx - panBefore.x) * (scaleAfter / scaleBefore)
    const cx = 400; const cy = 300;
    const ratio = scaleAfter / scaleBefore;
    expect(panAfter.x).toBeCloseTo(cx - (cx - afterPan.x) * ratio, 0);
    expect(panAfter.y).toBeCloseTo(cy - (cy - afterPan.y) * ratio, 0);
  });

  // ZM15 — zoom-in then zoom-out returns close to original scale (not exact due to float)
  it("ZM15 — zoom-in then zoom-out returns close to original scale", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const { zoomIn, zoomOut } = getZoomControls();
    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
    const scale = parseScale(getTransform(container));
    expect(scale).toBeCloseTo(1, 2);
  });

  // ZM16 — Batch 2-C regression: configMode toggle still works alongside zoom controls
  it("ZM16 — config toolbar appears/disappears independently of zoom state", () => {
    const { container, rerender } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} configMode={false} />
    );
    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    expect(container.querySelector('[data-testid="config-mode-toolbar"]')).toBeNull();

    rerender(<FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />);
    expect(container.querySelector('[data-testid="config-mode-toolbar"]')).not.toBeNull();
    // zoom scale is still elevated
    expect(parseScale(getTransform(container))).toBeGreaterThan(1);
  });
  // ── PM-series: Pan + drag-vs-click interaction tests ─────────────────────

  // PM1 — Pan starting on SVG artwork (polygon element)
  it("PM1 — pan initiates from mousedown on SVG polygon artwork", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    const svg  = container.querySelector("svg") as SVGSVGElement;

    // Mousedown on the SVG element itself (simulates click on map artwork)
    fireEvent.mouseDown(svg,  { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(wrap, { clientX: 130, clientY: 115 }); // 33px — well above threshold
    fireEvent.mouseUp(wrap);

    const { x, y } = parsePan(getTransform(container));
    // pan = 30, 15
    expect(x).toBeCloseTo(30, 0);
    expect(y).toBeCloseTo(15, 0);
  });

  // PM2 — Pan initiates when mousedown target is a building <g> element
  it("PM2 — pan initiates from mousedown on a building element", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} buildings={[makeBuilding()]} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    // Find the first role="button" g element (a building)
    const bldgG = container.querySelector('g[role="button"]') as SVGGElement;
    expect(bldgG).not.toBeNull();

    fireEvent.mouseDown(bldgG, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(wrap,  { clientX: 25, clientY: 10 }); // 27px — above threshold
    fireEvent.mouseUp(wrap);

    const { x, y } = parsePan(getTransform(container));
    expect(x).toBeCloseTo(25, 0);
    expect(y).toBeCloseTo(10, 0);
  });

  // PM3 — Simple click (no movement) still calls onSelectBuilding
  it("PM3 — a click with no movement selects the building", () => {
    const onSelectBuilding = vi.fn();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[makeBuilding()]}
        onSelectBuilding={onSelectBuilding}
      />
    );
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    const bldgG = container.querySelector('g[role="button"]') as SVGGElement;
    expect(bldgG).not.toBeNull();

    // mousedown+mouseup without any movement → no drag
    fireEvent.mouseDown(wrap, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(wrap,   { clientX: 100, clientY: 100 });
    // click on the building — should NOT be suppressed
    fireEvent.click(bldgG);

    expect(onSelectBuilding).toHaveBeenCalledTimes(1);
  });

  // PM4 — Drag (movement > threshold) does NOT call onSelectBuilding
  it("PM4 — a drag gesture does not trigger building selection", () => {
    const onSelectBuilding = vi.fn();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[makeBuilding()]}
        onSelectBuilding={onSelectBuilding}
      />
    );
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    const bldgG = container.querySelector('g[role="button"]') as SVGGElement;
    expect(bldgG).not.toBeNull();

    fireEvent.mouseDown(wrap, { clientX: 0,  clientY: 0 });
    fireEvent.mouseMove(wrap, { clientX: 20, clientY: 20 }); // 28px — above threshold
    fireEvent.mouseUp(wrap);
    // click event that would normally bubble from building after mouseUp
    fireEvent.click(bldgG);

    expect(onSelectBuilding).not.toHaveBeenCalled();
  });

  // PM5 — configMode: mousedown routes to config handler, not pan
  it("PM5 — in configMode mousedown does not start a pan gesture", () => {
    const { container } = render(
      <FacilityMapCampus {...DEFAULT_PROPS} configMode={true} />
    );
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;

    // jsdom does not implement SVG matrix methods needed by coordinateHelpers;
    // provide minimal stubs so onConfigMouseDown doesn't throw.
    const svgEl = container.querySelector('svg') as SVGSVGElement;
    Object.assign(svgEl, {
      getScreenCTM: () => ({
        a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
        inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      }),
      createSVGPoint: () => {
        const p = { x: 0, y: 0, matrixTransform: () => ({ x: 0, y: 0 }) };
        return p;
      },
    });
    fireEvent.mouseDown(wrap, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(wrap, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(wrap);

    // In configMode pan is suppressed; transform stays at identity
    const { x, y } = parsePan(getTransform(container));
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  // PM6 — Reset after zoom+pan restores both zoom and pan to defaults
  it("PM6 — reset after zoom and pan restores identity transform", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

    // Pan then zoom
    fireEvent.mouseDown(wrap, { clientX: 0,  clientY: 0 });
    fireEvent.mouseMove(wrap, { clientX: 40, clientY: 20 });
    fireEvent.mouseUp(wrap);
    const { zoomIn, reset } = getZoomControls();
    fireEvent.click(zoomIn);

    // Confirm we're not at identity
    const scale1 = parseScale(getTransform(container));
    expect(scale1).toBeGreaterThan(1);

    // Reset
    fireEvent.click(reset);
    const scale2 = parseScale(getTransform(container));
    const { x, y } = parsePan(getTransform(container));
    expect(scale2).toBeCloseTo(1, 3);
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  // PM7 — 3+ consecutive zoom-ins keep campus within accessible range
  it("PM7 — three consecutive zoom-ins keep map accessible (pan stays finite)", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

    const { zoomIn } = getZoomControls();
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);

    const scale = parseScale(getTransform(container));
    const { x, y } = parsePan(getTransform(container));

    // Scale should be around 1.3^3 ≈ 2.197
    expect(scale).toBeCloseTo(Math.pow(1.3, 3), 1);

    // Pan values must be finite and negative (map shifted left/up to keep centre fixed)
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
    expect(x).toBeLessThan(0); // shifted left
    expect(y).toBeLessThan(0); // shifted up

    // The pan must not push the map completely off screen:
    // The top-left corner of the map-inner is at (pan.x, pan.y).
    // For the map to remain accessible, at least part of the map must be visible.
    // With centre-zoom, the centre of the map-inner (400*scale, 300*scale relative to pan)
    // must still be within the viewport. Check: pan.x + 0 < 800 (right edge visible)
    // and pan.y + 0 < 600 (bottom edge visible)
    expect(x + scale * 800).toBeGreaterThan(0); // right edge of map still in viewport
    expect(y + scale * 600).toBeGreaterThan(0); // bottom edge of map still in viewport
  });

  // PM8 — zoom in then out after panning restores scale near 1 while preserving pan
  it("PM8 — zoom in then out after panning returns scale near original", () => {
    const { container } = render(<FacilityMapCampus {...DEFAULT_PROPS} />);
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    wrap.getBoundingClientRect = () => ({
      width: 800, height: 600, top: 0, left: 0,
      bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

    // Pan first
    fireEvent.mouseDown(wrap, { clientX: 0,  clientY: 0 });
    fireEvent.mouseMove(wrap, { clientX: 50, clientY: 30 });
    fireEvent.mouseUp(wrap);

    const { zoomIn, zoomOut } = getZoomControls();
    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);

    const scale = parseScale(getTransform(container));
    expect(scale).toBeCloseTo(1, 2);
  });
});

// ── Zone interaction tests (FM35–FM38) ───────────────────────────────────────

describe("zone editing interactions", () => {
  function makeBuildingWithZone() {
    return makeBuilding({
      id: "b1",
      name: "Main Building",
      x: 10,
      y: 10,
      width: 40,
      height: 30,
      zones: [
        {
          id: "z1",
          name: "Zone A",
          x: 20,
          y: 20,
          width: 30,
          height: 30,
          cameras_total: 0,
          cameras_online: 0,
          cameras: [],
        },
      ],
    });
  }

  // FM35: zone ghost rect renders during zone-drawing phase (after mousedown + move on selected building)
  it("FM35 — zone ghost rect renders after zone-draw drag starts", () => {
    const b = makeBuildingWithZone();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        configMode={true}
        editingBuildingId="b1"
      />
    );
    const wrap = container.querySelector(".fm-map-wrap") as HTMLElement;
    wrap.getBoundingClientRect = () => ({
      width: 780, height: 540, top: 0, left: 0,
      bottom: 540, right: 780, x: 0, y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

    // jsdom doesn't implement SVG coordinate methods — mock them on the svg element
    // so that screenToPct can convert screen coords → map-pct correctly.
    // Identity forward-CTM: 1 screen px = 1 SVG unit; inverse is also identity.
    const svgEl = container.querySelector("svg") as SVGSVGElement & Record<string, unknown>;
    const identityMatrix = () => ({
      a:1, b:0, c:0, d:1, e:0, f:0,
      inverse() { return identityMatrix(); },
    });
    svgEl.getScreenCTM = () => identityMatrix() as unknown as DOMMatrix;
    svgEl.createSVGPoint = () => {
      const pt = { x: 0, y: 0 } as SVGPoint;
      (pt as unknown as Record<string, unknown>).matrixTransform = (m: DOMMatrixReadOnly) => {
        const mm = m as unknown as { a:number; c:number; e:number; b:number; d:number; f:number };
        return { x: mm.a*pt.x + mm.c*pt.y + mm.e, y: mm.b*pt.x + mm.d*pt.y + mm.f, w:1, z:0, toJSON:()=>({}) } as DOMPoint;
      };
      return pt;
    };

    // Building at pct {x:10,y:10,w:40,h:30} → SVG pixels: left=78,top=54,right=390,bottom=216
    // Anchor and move point both inside building pixel area
    const bGroup = container.querySelector('[data-building-id="b1"]') as SVGElement;
    expect(bGroup).not.toBeNull();

    fireEvent.mouseDown(bGroup, { clientX: 100, clientY: 70 });
    fireEvent.mouseMove(wrap, { clientX: 250, clientY: 150 });

    const ghost = container.querySelector('[data-testid="zone-ghost-rect"]');
    expect(ghost).not.toBeNull();
  });

  // FM36: zone resize handles render when editingZoneId matches the zone
  it("FM36 — zone resize handles appear when editingZoneId matches zone", () => {
    const b = makeBuildingWithZone();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        configMode={true}
        editingBuildingId="b1"
        editingZoneId="z1"
      />
    );
    // All 8 handles should be present
    const handles = container.querySelectorAll('[data-testid^="zone-resize-handle-"]');
    expect(handles.length).toBe(8);
  });

  // FM37: mouseDown on already-selected building does NOT call onEditSelect
  it("FM37 — mouseDown on selected building starts zone draw, not onEditSelect", () => {
    const onEditSelect = vi.fn();
    const b = makeBuildingWithZone();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        configMode={true}
        editingBuildingId="b1"
        onEditSelect={onEditSelect}
      />
    );
    // Mock SVG methods so onZoneDrawStart doesn't throw in jsdom
    const svgEl = container.querySelector("svg") as SVGSVGElement & Record<string, unknown>;
    const identityMatrix = (): Record<string, unknown> => ({
      a:1, b:0, c:0, d:1, e:0, f:0,
      inverse() { return identityMatrix(); },
    });
    svgEl.getScreenCTM = () => identityMatrix() as unknown as DOMMatrix;
    svgEl.createSVGPoint = () => {
      const pt = { x: 0, y: 0 } as SVGPoint;
      (pt as unknown as Record<string, unknown>).matrixTransform = (m: DOMMatrixReadOnly) => {
        const mm = m as unknown as { a:number; c:number; e:number; b:number; d:number; f:number };
        return { x: mm.a*pt.x + mm.c*pt.y + mm.e, y: mm.b*pt.x + mm.d*pt.y + mm.f, w:1, z:0, toJSON:()=>({}) } as DOMPoint;
      };
      return pt;
    };
    const bGroup = container.querySelector('[data-building-id="b1"]') as SVGElement;
    expect(bGroup).not.toBeNull();
    fireEvent.mouseDown(bGroup, { clientX: 100, clientY: 100 });
    // onEditSelect must NOT have been called (zone draw path, not select+move path)
    expect(onEditSelect).not.toHaveBeenCalled();
  });

  // FM38: clicking a zone in config+isEditing calls onZoneEditSelect
  it("FM38 — clicking zone calls onZoneEditSelect with buildingId and zoneId", () => {
    const onZoneEditSelect = vi.fn();
    const b = makeBuildingWithZone();
    const { container } = render(
      <FacilityMapCampus
        {...DEFAULT_PROPS}
        buildings={[b]}
        configMode={true}
        editingBuildingId="b1"
        onZoneEditSelect={onZoneEditSelect}
      />
    );
    const zoneGroup = container.querySelector('[data-zone-id="z1"]') as SVGElement;
    expect(zoneGroup).not.toBeNull();
    fireEvent.click(zoneGroup);
    expect(onZoneEditSelect).toHaveBeenCalledWith("b1", "z1");
  });
});
