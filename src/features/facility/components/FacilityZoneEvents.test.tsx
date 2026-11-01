import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi } from "vitest";
import FacilityZoneEvents from "./FacilityZoneEvents";
import type { RecentZoneEvent, FacilityBuilding } from "../api/facility.types";

/** The component calls useNavigate, so every render needs Router context. */
function render(ui: ReactElement) {
  return rtlRender(ui, { wrapper: MemoryRouter });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<RecentZoneEvent> = {}): RecentZoneEvent {
  return {
    id: "evt-1",
    type: "motion",
    summary: "Motion detected in lobby",
    severity: "high",
    risk_score: 75,
    site: "Alpha Wing",
    zone: "Zone North",
    triggered: true,
    received_at: new Date(Date.now() - 120_000).toISOString(), // 2 min ago
    ...overrides,
  };
}

function makeBuilding(): FacilityBuilding {
  return {
    id: "building-uuid-1",
    name: "Alpha Wing",
    x: 10, y: 10, width: 30, height: 20,
    unzoned_cameras_total: 0,
    created_at: null,
    zones: [],
  };
}

const BUILDINGS = [makeBuilding()];

// ── Empty state ───────────────────────────────────────────────────────────────

describe("FacilityZoneEvents — empty state", () => {
  it("ZE1 — shows 'No recent events' when events array is empty", () => {
    render(
      <FacilityZoneEvents events={[]} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText(/no recent events/i)).toBeTruthy();
  });
});

// ── Event rendering ───────────────────────────────────────────────────────────

describe("FacilityZoneEvents — event rendering", () => {
  it("ZE2 — renders event summary text", () => {
    const evt = makeEvent({ summary: "Motion detected in lobby" });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText("Motion detected in lobby")).toBeTruthy();
  });

  it("ZE3 — renders severity badge", () => {
    const evt = makeEvent({ severity: "high" });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText("high")).toBeTruthy();
  });

  it("ZE4 — renders location from site and zone", () => {
    const evt = makeEvent({ site: "Alpha Wing", zone: "Zone North" });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText(/Alpha Wing.*Zone North/)).toBeTruthy();
  });

  it("ZE5 — renders relative time (e.g. '2m ago')", () => {
    const evt = makeEvent({ received_at: new Date(Date.now() - 120_000).toISOString() });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText(/ago/i)).toBeTruthy();
  });

  it("ZE6 — renders multiple events", () => {
    const events = [
      makeEvent({ id: "e1", summary: "Event one" }),
      makeEvent({ id: "e2", summary: "Event two" }),
    ];
    render(
      <FacilityZoneEvents events={events} buildings={BUILDINGS} onSelectBuilding={vi.fn()} />
    );
    expect(screen.getByText("Event one")).toBeTruthy();
    expect(screen.getByText("Event two")).toBeTruthy();
  });
});

// ── Building selection via event click ────────────────────────────────────────

describe("FacilityZoneEvents — building selection", () => {
  it("ZE7 — clicking event with known site calls onSelectBuilding with building UUID", () => {
    const onSelectBuilding = vi.fn();
    const evt = makeEvent({ site: "Alpha Wing" });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={onSelectBuilding} />
    );
    fireEvent.click(screen.getByText("Motion detected in lobby"));
    expect(onSelectBuilding).toHaveBeenCalledWith("building-uuid-1");
  });

  it("ZE8 — clicking event with unknown site does not call onSelectBuilding", () => {
    const onSelectBuilding = vi.fn();
    const evt = makeEvent({ site: "Unknown Site" });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={onSelectBuilding} />
    );
    fireEvent.click(screen.getByText("Motion detected in lobby"));
    expect(onSelectBuilding).not.toHaveBeenCalled();
  });

  it("ZE9 — event with null site does not call onSelectBuilding", () => {
    const onSelectBuilding = vi.fn();
    const evt = makeEvent({ site: null });
    render(
      <FacilityZoneEvents events={[evt]} buildings={BUILDINGS} onSelectBuilding={onSelectBuilding} />
    );
    fireEvent.click(screen.getByText("Motion detected in lobby"));
    expect(onSelectBuilding).not.toHaveBeenCalled();
  });
});

// ── No mock data fallback ─────────────────────────────────────────────────────

describe("FacilityZoneEvents — no mock data", () => {
  it("ZE10 — shows empty state (not mock data) when events=[]", () => {
    render(
      <FacilityZoneEvents events={[]} buildings={[]} onSelectBuilding={vi.fn()} />
    );
    // Must show empty state — never fall back to hardcoded mock events
    expect(screen.getByText(/no recent events/i)).toBeTruthy();
    // Confirm there are no event items rendered
    expect(screen.queryByText(/ago/i)).toBeNull();
  });
});
