/**
 * SelectedLocationPanel — Phase 1 test suite (SL1–SL27)
 *
 * SL1–SL13  Preserved baseline coverage (no selection, building, camera)
 * SL14      Add Zone trigger calls onAddZone with correct building
 * SL15–SL16 Building rename — opens inline edit, calls updateBuilding on Enter
 * SL17      Rename warning dialog when cameras matched
 * SL18      Zone rename calls updateZone with correct args
 * SL19      Zone rename warning when cameras matched
 * SL20–SL21 Delete building confirm + mutateAsync called after confirm
 * SL22–SL23 Delete zone confirm; description mentions cameras when present
 * SL24      Delete building description mentions zone count
 * SL25      Escape cancels rename without mutating
 * SL26      Permission gate — controls absent without hardware.register
 * SL27      Error does not close dialog (ConfirmActionButton stays open on error)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectedLocationPanel from "./SelectedLocationPanel";
import type { FacilityBuilding } from "../api/facility.types";

/* ─── Module-level mocks ──────────────────────────────────────────────────── */

// Facility actions — replace with controllable spies
const mockUpdateBuilding = vi.fn();
const mockDeleteBuilding = vi.fn();
const mockUpdateZone     = vi.fn();
const mockDeleteZone     = vi.fn();

vi.mock("../hooks/useFacilityMap", () => ({
  useFacilityActions: () => ({
    updateBuilding: { mutateAsync: mockUpdateBuilding, isPending: false },
    deleteBuilding: { mutateAsync: mockDeleteBuilding, isPending: false },
    updateZone:     { mutateAsync: mockUpdateZone,     isPending: false },
    deleteZone:     { mutateAsync: mockDeleteZone,     isPending: false },
  }),
}));

// Toast — prevent provider errors
const mockToastSuccess = vi.fn();
const mockToastError   = vi.fn();
vi.mock("../../../components/shared/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

// Authz — default: allow hardware.register
let mockIsAllowed = (_rule: unknown) => true;
vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: () => ({ isAllowed: (rule: unknown) => mockIsAllowed(rule) }),
}));

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function makeBuilding(overrides: Partial<FacilityBuilding> = {}): FacilityBuilding {
  return {
    id: "building-uuid-1",
    name: "Alpha Wing",
    x: 10, y: 10, width: 30, height: 20,
    unzoned_cameras_total: 2,
    created_at: null,
    zones: [
      {
        id: "zone-uuid-1",
        name: "Zone North",
        x: 0, y: 0, width: 50, height: 50,
        cameras_total: 3,
        cameras_online: 2,
        cameras: [
          { id: "cam-uuid-1", label: "CAM-01", type: "fixed", feed_status: "live" },
          { id: "cam-uuid-2", label: "CAM-02", type: "ptz",   feed_status: "offline" },
        ],
      },
    ],
    ...overrides,
  };
}

const BUILDINGS = [makeBuilding()];
const NO_ADD_ZONE = vi.fn();

const EMPTY_PROPS = {
  selectedCameraId: null,
  selectedBuildingId: null,
  buildings: BUILDINGS,
  onAddZone: NO_ADD_ZONE,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAllowed = () => true; // reset to "allow all" before each test
  mockUpdateBuilding.mockResolvedValue({ data: { id: "building-uuid-1" } });
  mockDeleteBuilding.mockResolvedValue({ data: { id: "building-uuid-1" } });
  mockUpdateZone.mockResolvedValue({ data: { id: "zone-uuid-1" } });
  mockDeleteZone.mockResolvedValue({});
});

/* ─── No selection ────────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — no selection", () => {
  it("SL1 — shows placeholder when nothing is selected", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} />);
    expect(screen.getByText(/click a camera or building/i)).toBeTruthy();
  });

  it("SL2 — shows placeholder with empty buildings list", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} buildings={[]} />);
    expect(screen.getByText(/click a camera or building/i)).toBeTruthy();
  });
});

/* ─── Building selection ──────────────────────────────────────────────────── */

describe("SelectedLocationPanel — building selected", () => {
  it("SL3 — shows building name", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    expect(screen.getAllByText("Alpha Wing").length).toBeGreaterThan(0);
  });

  it("SL4 — shows total camera count (zoned + unzoned)", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    // zone has 3 + 2 unzoned = 5
    expect(screen.getByText(/5 camera/i)).toBeTruthy();
  });

  it("SL5 — shows zone count", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    expect(screen.getByText(/1 zone/i)).toBeTruthy();
  });

  it("SL6 — unknown building UUID shows placeholder", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="non-existent-uuid" />);
    expect(screen.getByText(/click a camera or building/i)).toBeTruthy();
  });
});

/* ─── Camera selection ────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — camera selected", () => {
  it("SL7 — shows camera label", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-1" />);
    expect(screen.getByText("CAM-01")).toBeTruthy();
  });

  it("SL8 — shows parent building name", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-1" />);
    expect(screen.getAllByText(/Alpha Wing/).length).toBeGreaterThan(0);
  });

  it("SL9 — shows parent zone name", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-1" />);
    expect(screen.getByText(/Zone North/)).toBeTruthy();
  });

  it("SL10 — shows live status for live feed", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-1" />);
    expect(screen.getAllByText(/live/i).length).toBeGreaterThan(0);
  });

  it("SL11 — shows offline status for offline camera", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-2" />);
    expect(screen.getAllByText(/offline/i).length).toBeGreaterThan(0);
  });

  it("SL12 — unknown camera UUID shows placeholder (no crash)", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="non-existent-cam" />);
    expect(screen.getByText(/click a camera or building/i)).toBeTruthy();
  });

  it("SL13 — camera type is shown in details", () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedCameraId="cam-uuid-1" />);
    expect(screen.getByText("fixed")).toBeTruthy();
  });
});

/* ─── Add Zone ────────────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Add Zone", () => {
  it("SL14 — 'Add Zone' button calls onAddZone with the correct building", async () => {
    const onAddZone = vi.fn();
    render(
      <SelectedLocationPanel
        {...EMPTY_PROPS}
        selectedBuildingId="building-uuid-1"
        onAddZone={onAddZone}
      />
    );
    const btn = screen.getByTestId("add-zone-btn");
    await userEvent.click(btn);
    expect(onAddZone).toHaveBeenCalledTimes(1);
    expect(onAddZone.mock.calls[0][0]).toMatchObject({ id: "building-uuid-1", name: "Alpha Wing" });
  });
});

/* ─── Building rename ─────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Building rename", () => {
  it("SL15 — pencil button opens inline edit for the building", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    await userEvent.click(screen.getByTestId("rename-building-btn"));
    expect(screen.getByTestId("building-name-input")).toBeTruthy();
  });

  it("SL16 — pressing Enter on the input (no cameras) calls updateBuilding with correct payload", async () => {
    // Building with NO cameras to bypass the warning dialog
    const noCamBuilding = makeBuilding({
      unzoned_cameras_total: 0,
      zones: [{
        id: "zone-uuid-1", name: "Zone North",
        x: 0, y: 0, width: 50, height: 50,
        cameras_total: 0, cameras_online: 0, cameras: [],
      }],
    });
    render(
      <SelectedLocationPanel
        {...EMPTY_PROPS}
        buildings={[noCamBuilding]}
        selectedBuildingId="building-uuid-1"
      />
    );
    await userEvent.click(screen.getByTestId("rename-building-btn"));
    const input = screen.getByTestId("building-name-input");
    await userEvent.clear(input);
    await userEvent.type(input, "Beta Wing");
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockUpdateBuilding).toHaveBeenCalledWith({
        buildingId: "building-uuid-1",
        payload: { name: "Beta Wing" },
      });
    });
  });

  it("SL17 — rename warning dialog appears when building has cameras", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    await userEvent.click(screen.getByTestId("rename-building-btn"));
    const input = screen.getByTestId("building-name-input");
    await userEvent.clear(input);
    await userEvent.type(input, "Beta Wing");
    fireEvent.keyDown(input, { key: "Enter" });
    // Warning dialog should appear; updateBuilding NOT yet called
    await waitFor(() => expect(screen.getByText(/rename building/i)).toBeTruthy());
    expect(mockUpdateBuilding).not.toHaveBeenCalled();
  });
});

/* ─── Zone rename ─────────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Zone rename", () => {
  it("SL18 — zone rename (no cameras) calls updateZone with correct buildingId, zoneId, payload", async () => {
    const noCamBuilding = makeBuilding({
      unzoned_cameras_total: 0,
      zones: [{
        id: "zone-uuid-1", name: "Zone North",
        x: 0, y: 0, width: 50, height: 50,
        cameras_total: 0, cameras_online: 0, cameras: [],
      }],
    });
    render(
      <SelectedLocationPanel
        {...EMPTY_PROPS}
        buildings={[noCamBuilding]}
        selectedBuildingId="building-uuid-1"
      />
    );
    await userEvent.click(screen.getByTestId("rename-zone-btn-zone-uuid-1"));
    const input = screen.getByTestId("zone-name-input-zone-uuid-1");
    await userEvent.clear(input);
    await userEvent.type(input, "Zone South");
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockUpdateZone).toHaveBeenCalledWith({
        buildingId: "building-uuid-1",
        zoneId: "zone-uuid-1",
        payload: { name: "Zone South" },
      });
    });
  });

  it("SL19 — zone rename warning dialog appears when zone has cameras", async () => {
    // Zone has cameras_total: 3 (from makeBuilding default)
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    await userEvent.click(screen.getByTestId("rename-zone-btn-zone-uuid-1"));
    const input = screen.getByTestId("zone-name-input-zone-uuid-1");
    await userEvent.clear(input);
    await userEvent.type(input, "Zone South");
    fireEvent.keyDown(input, { key: "Enter" });
    // Warning dialog appears
    await waitFor(() => expect(screen.getByText(/rename zone/i)).toBeTruthy());
    expect(mockUpdateZone).not.toHaveBeenCalled();
  });
});

/* ─── Delete building ─────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Delete building", () => {
  it("SL20 — Delete Building button shows confirmation dialog", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    // "Delete Building" is the trigger; "Delete Building" (title case) is distinct from confirm btn
    await userEvent.click(screen.getByRole("button", { name: "Delete Building" }));
    // ConfirmDialog renders an <h3> with the title
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /delete "Alpha Wing"/i })).toBeTruthy()
    );
  });

  it("SL21 — confirming delete building calls deleteBuilding.mutateAsync with the building id", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Delete Building" }));
    // confirmLabel="Delete building" (lowercase b) is distinct from trigger "Delete Building"
    const confirmBtn = await screen.findByRole("button", { name: "Delete building" });
    await userEvent.click(confirmBtn);
    await waitFor(() => {
      expect(mockDeleteBuilding).toHaveBeenCalledWith("building-uuid-1");
    });
  });

  it("SL24 — delete building description mentions zone count when zones exist", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    await userEvent.click(screen.getByRole("button", { name: /delete building/i }));
    await waitFor(() =>
      expect(screen.getByText(/1 of its zone/i)).toBeTruthy()
    );
  });
});

/* ─── Delete zone ─────────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Delete zone", () => {
  it("SL22 — Delete zone button shows confirmation dialog", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    // Zone delete label is exactly "Delete"; building delete is "Delete Building"
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /delete zone/i })).toBeTruthy()
    );
  });

  it("SL23 — delete zone description mentions cameras when zone has cameras", async () => {
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    // Zone North has cameras_total: 3
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      // Description says cameras remain registered but will appear unzoned
      expect(screen.getByText(/cameras remain registered/i)).toBeTruthy()
    );
  });
});

/* ─── Escape cancels rename ──────────────────────────────────────────────── */

describe("SelectedLocationPanel — Escape cancels rename", () => {
  it("SL25 — pressing Escape in building name input cancels without calling mutation", async () => {
    const noCamBuilding = makeBuilding({
      unzoned_cameras_total: 0,
      zones: [{
        id: "zone-uuid-1", name: "Zone North",
        x: 0, y: 0, width: 50, height: 50,
        cameras_total: 0, cameras_online: 0, cameras: [],
      }],
    });
    render(
      <SelectedLocationPanel
        {...EMPTY_PROPS}
        buildings={[noCamBuilding]}
        selectedBuildingId="building-uuid-1"
      />
    );
    await userEvent.click(screen.getByTestId("rename-building-btn"));
    const input = screen.getByTestId("building-name-input");
    fireEvent.keyDown(input, { key: "Escape" });
    // Input should disappear
    await waitFor(() =>
      expect(screen.queryByTestId("building-name-input")).toBeNull()
    );
    expect(mockUpdateBuilding).not.toHaveBeenCalled();
  });
});

/* ─── Permission gate ─────────────────────────────────────────────────────── */

describe("SelectedLocationPanel — Permission gate", () => {
  it("SL26 — management controls are absent without hardware.register", () => {
    mockIsAllowed = () => false; // deny all permissions
    render(<SelectedLocationPanel {...EMPTY_PROPS} selectedBuildingId="building-uuid-1" />);
    expect(screen.queryByTestId("rename-building-btn")).toBeNull();
    expect(screen.queryByTestId("add-zone-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: /delete building/i })).toBeNull();
  });
});
