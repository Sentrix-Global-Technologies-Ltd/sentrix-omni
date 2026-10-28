/**
 * FacilityMapPage — Config Mode authorization tests (FMP1–FMP5)
 *
 * Scope: verify that the Edit Map / Exit Config toggle is rendered only when
 * the authenticated principal holds the `bridges.manage` permission, and that
 * clicking it transitions the button label as expected for authorized users.
 *
 * Strategy:
 *   • Mock every hook that issues network requests (useFacilityMap,
 *     useFacilityActions, useOrgCameraSources) — tests must not call the API.
 *   • Mock heavy SVG child components (FacilityMapCampus, etc.) with lightweight
 *     stubs — the permission logic lives in FacilityMapPage itself, not the canvas.
 *   • Control the `isAllowed` resolver from `useAuthz` per test to simulate
 *     authorized vs. unauthorized principals.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FacilityMapPage from "./FacilityMapPage";

// ── Module mocks ──────────────────────────────────────────────────────────────

// PageMeta uses react-helmet-async which requires a HelmetProvider context;
// stub it out to avoid provider noise in unit tests.
vi.mock("../../../components/common/PageMeta", () => ({
  default: () => null,
}));

// Stub all facility hooks — no QueryClient / backend needed.
vi.mock("../hooks/useFacilityMap", () => ({
  useFacilityMap: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useFacilityActions: () => ({
    updateBuilding:   { mutateAsync: vi.fn(), isPending: false },
    updateZone:       { mutateAsync: vi.fn(), isPending: false },
    placeCameraOnMap: { mutateAsync: vi.fn(), isPending: false },
    createBuilding:   { mutateAsync: vi.fn(), isPending: false },
    deleteBuilding:   { mutateAsync: vi.fn(), isPending: false },
    createZone:       { mutateAsync: vi.fn(), isPending: false },
    deleteZone:       { mutateAsync: vi.fn(), isPending: false },
  }),
  useOrgCameraSources: () => ({ data: undefined, isLoading: false }),
}));

// Stub SVG-heavy canvas component. Captures props so tests can inspect
// whether onPlaceCamera was passed (camera placement permission gating).
let lastCampusProps: Record<string, unknown> = {};
vi.mock("../components/FacilityMapCampus", () => ({
  default: (props: Record<string, unknown>) => {
    lastCampusProps = props;
    return <div data-testid="stub-campus" />;
  },
}));

// Stub modal components that use hooks internally.
vi.mock("../components/AddBuildingModal", () => ({
  default: () => null,
}));
vi.mock("../components/AddZoneModal", () => ({
  default: () => null,
}));

// Stub remaining UI components (no permission logic in these).
vi.mock("../components/MapControlsPanel", () => ({
  default: () => <div data-testid="stub-controls" />,
}));
vi.mock("../components/FacilityZoneEvents", () => ({
  default: () => <div data-testid="stub-events" />,
}));
vi.mock("../components/SelectedLocationPanel", () => ({
  default: () => <div data-testid="stub-selected" />,
}));
vi.mock("../components/FacilityMapLegend", () => ({
  default: () => null,
}));

// Authz mock — controlled per test via `mockIsAllowed`.
let mockIsAllowed: (rule: unknown) => boolean = () => true;
vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: () => ({ isAllowed: (rule: unknown) => mockIsAllowed(rule) }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  return render(<FacilityMapPage />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  lastCampusProps = {};
  mockIsAllowed = () => true; // default: all permissions granted
});

describe("FacilityMapPage — Config Mode permission gating", () => {
  // FMP1: Authorized user sees the Edit Map toggle
  it("FMP1 — user with both bridges.manage and hardware.register sees the Edit Map toggle", () => {
    mockIsAllowed = () => true;
    renderPage();
    // Note: the Button component does not forward data-* attributes; query by
    // role + accessible name, which is the recommended RTL approach anyway.
    const toggle = screen.getByRole("button", { name: /edit map/i });
    expect(toggle).toBeTruthy();
  });

  // FMP2: Unauthorized user never sees the toggle
  it("FMP2 — user without bridges.manage does not see the Edit Map toggle", () => {
    mockIsAllowed = () => false;
    renderPage();
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
  });

  // FMP3: Authorized user can enter Config Mode — label changes to Exit Config
  it("FMP3 — authorized user enters Config Mode on click; label becomes Exit Config", () => {
    mockIsAllowed = () => true;
    renderPage();
    const toggle = screen.getByRole("button", { name: /edit map/i });
    fireEvent.click(toggle);
    // After entering config mode the same element now reads "Exit Config".
    expect(screen.getByRole("button", { name: /exit config/i })).toBeTruthy();
  });

  // FMP4: Clicking Exit Config returns button label to Edit Map
  it("FMP4 — clicking Exit Config reverts label to Edit Map", () => {
    mockIsAllowed = () => true;
    renderPage();
    // Enter config mode
    fireEvent.click(screen.getByRole("button", { name: /edit map/i }));
    // Exit config mode
    fireEvent.click(screen.getByRole("button", { name: /exit config/i }));
    expect(screen.getByRole("button", { name: /edit map/i })).toBeTruthy();
  });

  // FMP5: Only bridges.manage denial hides the toggle; other permissions don't affect it
  it("FMP5 — denying only bridges.manage hides the toggle while other permissions pass", () => {
    // Simulate a principal that has hardware.register (Add Building visible) but
    // NOT bridges.manage. The Can component calls isAllowed with
    // { anyPermission: ["bridges.manage"] } for the Edit Map toggle — deny only that.
    mockIsAllowed = (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      if (Array.isArray(r?.anyPermission) && r.anyPermission.includes("bridges.manage")) {
        return false; // no bridges.manage → toggle hidden
      }
      return true; // other permissions (hardware.register etc.) still pass
    };
    renderPage();
    // Toggle must be hidden
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
    // But Add Building (hardware.register) is still visible
    expect(screen.getByRole("button", { name: /add building/i })).toBeTruthy();
  });
});

describe("FacilityMapPage — Config Mode dual-permission gate (FMP6–FMP9)", () => {
  // FMP6: bridges.manage YES + hardware.register NO → toggle hidden
  it("FMP6 — bridges.manage granted but hardware.register denied: Edit Map hidden", () => {
    // Only bridges.manage passes; hardware.register (and everything else) denied.
    mockIsAllowed = (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      if (Array.isArray(r?.anyPermission) && r.anyPermission.includes("hardware.register")) {
        return false;
      }
      return true; // bridges.manage and others pass
    };
    renderPage();
    // Without hardware.register canManageConfig is false → toggle hidden
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
  });

  // FMP7: hardware.register YES + bridges.manage NO → toggle hidden
  it("FMP7 — hardware.register granted but bridges.manage denied: Edit Map hidden", () => {
    // Mirrors FMP5 but from the hardware.register direction.
    mockIsAllowed = (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      if (Array.isArray(r?.anyPermission) && r.anyPermission.includes("bridges.manage")) {
        return false;
      }
      return true; // hardware.register and others pass
    };
    renderPage();
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
    // hardware.register still passes → Add Building visible, confirming selective denial
    expect(screen.getByRole("button", { name: /add building/i })).toBeTruthy();
  });

  // FMP8: Both denied → toggle hidden (belt-and-suspenders; FMP2 covers all-false)
  it("FMP8 — both permissions denied: Edit Map hidden", () => {
    mockIsAllowed = () => false;
    renderPage();
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
  });

  // FMP9: Both granted → toggle visible and functional (explicit dual-permission pass)
  it("FMP9 — both bridges.manage and hardware.register granted: Edit Map available", () => {
    // Explicitly grant both; deny everything else to confirm neither alone is enough.
    mockIsAllowed = (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      const perms = r?.anyPermission ?? [];
      return perms.includes("bridges.manage") || perms.includes("hardware.register");
    };
    renderPage();
    const toggle = screen.getByRole("button", { name: /edit map/i });
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /exit config/i })).toBeTruthy();
  });
});

describe("FacilityMapPage — Camera placement permission gate (FMP10–FMP11)", () => {
  // FMP10: bridges.manage granted → onPlaceCamera prop is passed (not undefined)
  it("FMP10 — bridges.manage granted: onPlaceCamera prop passed to campus", () => {
    mockIsAllowed = () => true;
    renderPage();
    // lastCampusProps.onPlaceCamera is the handler function; should be defined
    expect(typeof lastCampusProps["onPlaceCamera"]).toBe("function");
  });

  // FMP11: bridges.manage denied → onPlaceCamera prop is undefined (no drag affordance)
  it("FMP11 — bridges.manage denied: onPlaceCamera prop is undefined", () => {
    mockIsAllowed = () => false;
    renderPage();
    // Without bridges.manage the parent passes undefined, so the campus never fires it
    expect(lastCampusProps["onPlaceCamera"]).toBeUndefined();
  });
});

describe("FacilityMapPage — Read-only map availability (FMP12)", () => {
  // FMP12: no Config Mode permissions → campus stub still rendered (read-only map available)
  it("FMP12 — user with no permissions still sees the read-only map canvas", () => {
    mockIsAllowed = () => false;
    renderPage();
    // The map canvas must always be present regardless of permissions
    expect(screen.getByTestId("stub-campus")).toBeTruthy();
    // But Config Mode controls are absent
    expect(screen.queryByRole("button", { name: /edit map/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /add building/i })).toBeNull();
  });
});

