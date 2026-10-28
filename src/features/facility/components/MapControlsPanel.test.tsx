import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MapControlsPanel from "./MapControlsPanel";
import type { LayerKey } from "../data/facilityMockData";

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  cameras: true,
  zones: true,
  alerts: true,
  "access-points": true,
  sensors: false,
  perimeter: true,
  "building-labels": true,
};

const DEFAULT_PROPS = {
  layers: DEFAULT_LAYERS,
  onToggleLayer: vi.fn(),
  zoneFilter: "all",
  onZoneFilter: vi.fn(),
  zoneFilterOptions: [{ value: "all", label: "All Zones" }],
  cameraCounts: { online: 4, offline: 2, total: 6 },
};

// ── Camera status counts ──────────────────────────────────────────────────────

describe("MapControlsPanel — camera counts", () => {
  it("MC1 — renders online count from prop", () => {
    render(<MapControlsPanel {...DEFAULT_PROPS} cameraCounts={{ online: 7, offline: 3, total: 10 }} />);
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("MC2 — renders offline count from prop", () => {
    render(<MapControlsPanel {...DEFAULT_PROPS} cameraCounts={{ online: 7, offline: 3, total: 10 }} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("MC3 — renders total count from prop", () => {
    render(<MapControlsPanel {...DEFAULT_PROPS} cameraCounts={{ online: 7, offline: 3, total: 10 }} />);
    expect(screen.getByText("10")).toBeTruthy();
  });

  it("MC4 — shows zero counts without crashing", () => {
    render(<MapControlsPanel {...DEFAULT_PROPS} cameraCounts={{ online: 0, offline: 0, total: 0 }} />);
    // All three zeros displayed
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
});
