/**
 * LiveAiTimeline — focused tests (AT series).
 *
 * Covers:
 *  - Pure helpers: buildTimeSlots, dominantCategory, formatSlotTime
 *  - Component states: loading, error, empty, data
 *  - Detection-type filter and category display
 *  - Camera-specific query scope
 *  - Honest labelling (no "Live Feed" badge, coverage note present)
 *  - No silent fallback to mock data on error
 */
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  buildTimeSlots,
  dominantCategory,
  formatSlotTime,
  SLOT_COUNT,
  SLOT_MS,
} from "./LiveAiTimeline";
import LiveAiTimeline from "./LiveAiTimeline";

/* ── Module mocks ────────────────────────────────────────────────────────── */
const mockRefetch = vi.fn();
const mockUseRecentDetections = vi.fn();

vi.mock("../hooks/useRecentDetections", () => ({
  useRecentDetections: (...args: unknown[]) => mockUseRecentDetections(...args),
}));

/* ── Fixtures ────────────────────────────────────────────────────────────── */
/** A fixed "now" for deterministic slot calculations: 2026-10-18 10:42:30 UTC */
const FIXED_NOW_MS = new Date("2026-10-18T10:42:30Z").getTime();

/** slot[6] starts at 10:40 UTC (current bucket), slot[5] at 10:35, etc. */
const CURRENT_BUCKET_START_MS = Math.floor(FIXED_NOW_MS / SLOT_MS) * SLOT_MS;

function makeEvent(
  type: string,
  receivedAt: string,
  id = Math.random().toString(36).slice(2),
) {
  return {
    id,
    organization_id: "org-1",
    source: "vision" as const,
    product: null,
    camera_source_id: null,
    type,
    severity: "medium" as const,
    risk_score: 50,
    triggered: false,
    incident_id: null,
    site: null,
    zone: null,
    lat: null,
    lng: null,
    summary: null,
    received_at: receivedAt,
    created_at: receivedAt,
  };
}

/** Build a timestamp in the Nth slot (0 = oldest, 6 = current). */
function tsInSlot(slotIndex: number, offsetSec = 30): string {
  const slotStart = CURRENT_BUCKET_START_MS - (SLOT_COUNT - 1 - slotIndex) * SLOT_MS;
  return new Date(slotStart + offsetSec * 1000).toISOString();
}

/* ── Setup helper ────────────────────────────────────────────────────────── */
type SetupState = {
  isLoading?: boolean;
  isError?: boolean;
  events?: ReturnType<typeof makeEvent>[];
};

function setup(state: SetupState = {}) {
  const data =
    state.events !== undefined
      ? { data: state.events, message: "ok" }
      : undefined;

  mockUseRecentDetections.mockReturnValue({
    data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: mockRefetch,
  });
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Pure helper tests — no rendering required                                 */
/* ══════════════════════════════════════════════════════════════════════════ */

describe("buildTimeSlots", () => {
  it("AT1: produces exactly SLOT_COUNT slots", () => {
    const slots = buildTimeSlots([], FIXED_NOW_MS);
    expect(slots).toHaveLength(SLOT_COUNT);
  });

  it("AT2: only the last slot is marked isLive", () => {
    const slots = buildTimeSlots([], FIXED_NOW_MS);
    const liveSlots = slots.filter((s) => s.isLive);
    expect(liveSlots).toHaveLength(1);
    expect(liveSlots[0]!.id).toBe(slots[SLOT_COUNT - 1]!.id);
  });

  it("AT3: consecutive slots are exactly SLOT_MS apart", () => {
    const slots = buildTimeSlots([], FIXED_NOW_MS);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i]!.startMs - slots[i - 1]!.startMs).toBe(SLOT_MS);
    }
  });

  it("AT4: last slot contains nowMs (current bucket)", () => {
    const slots = buildTimeSlots([], FIXED_NOW_MS);
    const last = slots[SLOT_COUNT - 1]!;
    expect(FIXED_NOW_MS).toBeGreaterThanOrEqual(last.startMs);
    expect(FIXED_NOW_MS).toBeLessThan(last.startMs + SLOT_MS);
  });

  it("AT5: event in slot[6] is counted in that slot", () => {
    const events = [makeEvent("loitering", tsInSlot(6))];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots[6]!.allCount).toBe(1);
    expect(slots[5]!.allCount).toBe(0);
  });

  it("AT6: event in slot[3] is counted in slot[3] only", () => {
    const events = [makeEvent("vehicle_detected", tsInSlot(3))];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots[3]!.allCount).toBe(1);
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (i !== 3) expect(slots[i]!.allCount).toBe(0);
    }
  });

  it("AT7: multiple events in same slot are summed", () => {
    const events = [
      makeEvent("loitering", tsInSlot(2)),
      makeEvent("intrusion", tsInSlot(2)),
      makeEvent("vehicle", tsInSlot(2)),
    ];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots[2]!.allCount).toBe(3);
  });

  it("AT8: event with null received_at is ignored", () => {
    const events = [makeEvent("loitering", null as unknown as string)];
    // Override received_at to null post-construction
    events[0]!.received_at = null;
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots.reduce((s, sl) => s + sl.allCount, 0)).toBe(0);
  });

  it("AT9: event outside the time window is not counted", () => {
    // 2 hours before FIXED_NOW — well outside the 35-min window
    const ts = new Date(FIXED_NOW_MS - 2 * 60 * 60 * 1000).toISOString();
    const events = [makeEvent("intrusion", ts)];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots.reduce((s, sl) => s + sl.allCount, 0)).toBe(0);
  });

  it("AT10: per-category counts match event types", () => {
    const events = [
      makeEvent("vehicle_detected", tsInSlot(4)),
      makeEvent("vehicle_detected", tsInSlot(4)),
      makeEvent("person_detected", tsInSlot(4)),
      makeEvent("weapon_detected", tsInSlot(4)),
    ];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots[4]!.counts.vehicle).toBe(2);
    expect(slots[4]!.counts.person).toBe(1);
    expect(slots[4]!.counts.security).toBe(1);
    expect(slots[4]!.counts.activity).toBe(0);
  });

  it("AT11: dominantType reflects highest-count category", () => {
    const events = [
      makeEvent("weapon_detected", tsInSlot(1)),
      makeEvent("weapon_detected", tsInSlot(1)),
      makeEvent("loitering", tsInSlot(1)),
    ];
    const slots = buildTimeSlots(events, FIXED_NOW_MS);
    expect(slots[1]!.dominantType).toBe("security");
  });

  it("AT12: empty slot dominantType defaults to 'activity'", () => {
    const slots = buildTimeSlots([], FIXED_NOW_MS);
    expect(slots[0]!.dominantType).toBe("activity");
  });
});

describe("dominantCategory", () => {
  it("AT13: security wins when tied with vehicle", () => {
    expect(
      dominantCategory({ security: 2, vehicle: 2, person: 0, activity: 0 }),
    ).toBe("security");
  });

  it("AT14: vehicle beats person when tied", () => {
    expect(
      dominantCategory({ security: 0, vehicle: 3, person: 3, activity: 1 }),
    ).toBe("vehicle");
  });

  it("AT15: all-zero returns 'activity'", () => {
    expect(
      dominantCategory({ security: 0, vehicle: 0, person: 0, activity: 0 }),
    ).toBe("activity");
  });
});

describe("formatSlotTime", () => {
  it("AT16: returns a non-empty AM/PM string for a valid epoch", () => {
    const label = formatSlotTime(FIXED_NOW_MS);
    expect(label).toMatch(/\d+:\d{2}\s?(AM|PM)/i);
  });
});

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Component rendering tests                                                 */
/* ══════════════════════════════════════════════════════════════════════════ */

describe("LiveAiTimeline component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
  });

  it("AT17: shows loading indicator when isLoading=true and no previous data", () => {
    setup({ isLoading: true });
    render(<LiveAiTimeline />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("AT18: shows error alert when isError=true and no previous data", () => {
    setup({ isError: true });
    render(<LiveAiTimeline />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load detections/i)).toBeInTheDocument();
  });

  it("AT19: Retry button calls refetch", () => {
    setup({ isError: true });
    render(<LiveAiTimeline />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("AT20: error state shows no fabricated incident/event data", () => {
    setup({ isError: true });
    render(<LiveAiTimeline />);
    // Legacy mock time labels must not appear
    expect(screen.queryByText("10:30 AM")).toBeNull();
    expect(screen.queryByText("10:45:23 AM")).toBeNull();
    expect(document.querySelectorAll(".lm-htl-slot").length).toBe(0);
  });

  it("AT21: empty state shown when all slots have 0 detections", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(screen.getByText(/No detections in the past/i)).toBeInTheDocument();
  });

  it("AT22: empty state keeps the timeline track and shows the quiet-period notice inside the region", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    const region = screen.getByRole("region", { name: /ai detection timeline/i });
    expect(region.querySelector(".lm-htl-track")).not.toBeNull();
    expect(within(region).getByText(/No detections in the past/i)).toBeInTheDocument();
    // No slot has any detection while empty
    expect(region.querySelectorAll(".lm-htl-slot:not(.lm-htl-slot--empty)").length).toBe(0);
  });

  it("AT23: renders timeline slots when events are present", () => {
    setup({ events: [makeEvent("loitering", new Date().toISOString())] });
    render(<LiveAiTimeline />);
    expect(document.querySelectorAll(".lm-htl-slot").length).toBeGreaterThan(0);
  });

  it("AT24: count in current slot reflects real event", () => {
    setup({ events: [makeEvent("loitering", new Date().toISOString())] });
    render(<LiveAiTimeline />);
    // The live slot should show count=1
    const liveSlot = document.querySelector(".lm-htl-slot--live");
    expect(liveSlot).not.toBeNull();
    const countEl = liveSlot!.querySelector(".lm-htl-count");
    expect(countEl?.textContent).toBe("1");
  });

  it("AT25: filter dropdown is rendered and operable", () => {
    setup({ events: [makeEvent("loitering", new Date().toISOString())] });
    render(<LiveAiTimeline />);
    const select = screen.getByRole("combobox", { name: /Filter detection events/i });
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "vehicle" } });
    // After switching to vehicle filter, the live slot (loitering = activity) shows 0
    const liveSlot = document.querySelector(".lm-htl-slot--live");
    const countEl = liveSlot!.querySelector(".lm-htl-count");
    expect(countEl?.textContent).toBe("0");
  });

  it("AT26: security filter shows security events, hides others", () => {
    const now = new Date().toISOString();
    setup({
      events: [
        makeEvent("weapon_detected", now),
        makeEvent("vehicle_detected", now),
      ],
    });
    render(<LiveAiTimeline />);
    const select = screen.getByRole("combobox", { name: /Filter detection events/i });
    fireEvent.change(select, { target: { value: "security" } });
    const liveSlot = document.querySelector(".lm-htl-slot--live");
    expect(liveSlot!.querySelector(".lm-htl-count")!.textContent).toBe("1");
  });

  it("AT27: 'Live Feed' badge is NOT rendered (polling, not push)", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(screen.queryByText(/Live Feed/i)).toBeNull();
    expect(screen.queryByText(/Live feed/i)).toBeNull();
  });

  it("AT28: 'SIMULATED' badge is NOT rendered when showing real data", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(screen.queryByText(/SIMULATED/i)).toBeNull();
  });

  it("AT29: data-coverage note is present when data resolves", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(screen.getByLabelText("Data coverage note")).toBeInTheDocument();
    expect(screen.getByLabelText("Data coverage note").textContent).toMatch(/50/);
    expect(screen.getByLabelText("Data coverage note").textContent).toMatch(/30 s/);
  });

  it("AT30: passes cameraSourceId to useRecentDetections", () => {
    setup({ events: [] });
    render(<LiveAiTimeline cameraSourceId="cam-abc" />);
    expect(mockUseRecentDetections).toHaveBeenCalledWith(
      expect.objectContaining({ cameraSourceId: "cam-abc" }),
    );
  });

  it("AT31: passes null cameraSourceId when no camera selected (org-wide)", () => {
    setup({ events: [] });
    render(<LiveAiTimeline cameraSourceId={null} />);
    expect(mockUseRecentDetections).toHaveBeenCalledWith(
      expect.objectContaining({ cameraSourceId: null }),
    );
  });

  it("AT32: passes limit=50 to useRecentDetections", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(mockUseRecentDetections).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it("AT33: coverage note shows 'this camera' when cameraSourceId is provided", () => {
    setup({ events: [] });
    render(<LiveAiTimeline cameraSourceId="cam-abc" />);
    expect(screen.getByLabelText("Data coverage note").textContent).toMatch(/this camera/i);
  });

  it("AT34: coverage note shows 'all cameras' when no camera is selected", () => {
    setup({ events: [] });
    render(<LiveAiTimeline />);
    expect(screen.getByLabelText("Data coverage note").textContent).toMatch(/all cameras/i);
  });
});
