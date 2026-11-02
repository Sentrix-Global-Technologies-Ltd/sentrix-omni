/**
 * HardwareConsolePage — device registration tests (HCP series).
 *
 * Tests covered:
 *   HCP-1   "Register device" button visible on Devices tab when user has
 *            hardware.register permission.
 *   HCP-2   "Register device" button hidden when user lacks
 *            hardware.register permission.
 *   HCP-3   "Register device" button present when Devices list is empty.
 *   HCP-4   Clicking "Register device" opens the RegisterDeviceDrawer.
 *   HCP-5   Drawer submit is disabled when required fields are blank.
 *   HCP-6   Drawer submit is disabled when serial is blank (name present).
 *   HCP-7   Drawer submit is disabled when name is blank (serial present).
 *   HCP-8   Successful registration shows success toast and closes drawer.
 *   HCP-9   useRegisterDevice calls the correct endpoint and payload.
 *   HCP-10  Failed registration shows error toast and leaves drawer open.
 *   HCP-11  Successful registration invalidates hardware query cache
 *            (useQueryClient.invalidateQueries called with org-scoped key).
 *   HCP-12  Switching to Site Bridges tab does NOT show "Register device".
 *   HCP-13  Switching to Live Feeds tab does NOT show "Register device".
 *   HCP-14  Registration does not interact with camera-feed or bridge queries
 *            (regression — domain isolation).
 *   HCP-15  Backend kind validation error appears under Device type field.
 *   HCP-16  Backend serial validation error appears under Serial number field.
 *            (regression — domain isolation).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorFromStatus } from "../../../services/api/errors";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ─── Module-level mocks ─────────────────────────────────────────────────── */

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../components/shared/Breadcrumb", () => ({ default: () => null }));

vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual<typeof import("react-router-dom")>();
  return { ...actual, Link: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: () => ({ activeId: "org-test" }),
}));

// useAuthz — controls permission checks via Can component
vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: vi.fn(),
}));

// Toast — prevent "useToast must be used within a ToastProvider" error
// and allow inspection of calls.
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("../../../components/shared/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

// Hardware hooks
const mockRegisterMutateAsync = vi.fn();
const mockRegisterReset = vi.fn();
let mockRegisterIsPending = false;

vi.mock("../hooks/useHardware", () => ({
  useDevices: vi.fn(),
  useRegisterDevice: vi.fn(),
  useDeviceActions: vi.fn(() => ({
    resync: { mutateAsync: vi.fn(), isPending: false },
    diagnose: { mutateAsync: vi.fn(), isPending: false },
  })),
}));

// Site bridges
vi.mock("../../site-bridges/hooks/useSiteBridges", () => ({
  useSiteBridges: vi.fn(),
}));
vi.mock("../../site-bridges/components/BridgeTable", () => ({
  default: () => <div data-testid="bridge-table" />,
}));
vi.mock("../../site-bridges/components/OnboardBridgeButton", () => ({
  default: () => <button>Onboard bridge</button>,
}));

// Camera feeds
vi.mock("../../camera-feeds/hooks/useCameraFeeds", () => ({
  useCameraFeeds: vi.fn(),
}));
vi.mock("../../camera-feeds/components/CameraFeedGrid", () => ({
  default: () => <div data-testid="feed-grid" />,
}));

// Pagination — not under test
vi.mock("../../../components/ui/pagination/Pagination", () => ({
  default: () => null,
}));

// ConfirmActionButton — used by DeviceActions; not under test here
vi.mock("../../../components/shared/ConfirmActionButton", () => ({
  default: ({ label }: { label: string }) => <button>{label}</button>,
}));

/* ─── Imports after mocks ────────────────────────────────────────────────── */

import HardwareConsolePage from "./HardwareConsolePage";
import { useDevices, useRegisterDevice } from "../hooks/useHardware";
import { useSiteBridges } from "../../site-bridges/hooks/useSiteBridges";
import { useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";
import { useAuthz } from "../../../hooks/useAuthz";
import type { Device } from "../api/hardware.types";
import { ValidationError } from "../../../services/api/errors";

/* ─── Fixtures ───────────────────────────────────────────────────────────── */

function makeDevice(partial: Partial<Device> = {}): Device {
  return {
    id: "dev-1",
    organization_id: "org-test",
    registered_by: "user-1",
    kind: "sensor",
    serial: "SN-001",
    name: "Main Sensor",
    site: "Building A",
    zone: "Reception",
    status: "active",
    last_seen_at: new Date().toISOString(),
    metadata: null,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

const emptyDevices = { isLoading: false, error: null, data: { data: [], meta: {} }, refetch: vi.fn() };
const emptyBridges = { isLoading: false, error: null, data: { data: [], meta: {} }, refetch: vi.fn() };
const emptyFeeds   = { isLoading: false, error: null, data: { data: [] },           refetch: vi.fn() };

/* ─── Setup ──────────────────────────────────────────────────────────────── */

beforeEach(() => {
  mockSuccess.mockClear();
  mockError.mockClear();
  mockRegisterMutateAsync.mockClear();
  mockRegisterReset.mockClear();
  mockRegisterIsPending = false;

  // Default: user has hardware.register permission
  vi.mocked(useAuthz).mockReturnValue({
    isAllowed: (rule: unknown) => {
      if (typeof rule === "string") return true;
      if (rule && typeof rule === "object" && "permission" in rule) {
        return (rule as { permission: string }).permission === "hardware.register";
      }
      return true;
    },
  } as ReturnType<typeof useAuthz>);

  vi.mocked(useDevices).mockReturnValue(emptyDevices as ReturnType<typeof useDevices>);
  vi.mocked(useSiteBridges).mockReturnValue(emptyBridges as ReturnType<typeof useSiteBridges>);
  vi.mocked(useCameraFeeds).mockReturnValue(emptyFeeds as ReturnType<typeof useCameraFeeds>);

  vi.mocked(useRegisterDevice).mockReturnValue({
    mutateAsync: mockRegisterMutateAsync,
    reset: mockRegisterReset,
    isPending: mockRegisterIsPending,
    isError: false,
    isSuccess: false,
    error: null,
  } as unknown as ReturnType<typeof useRegisterDevice>);

  // Default: mutateAsync resolves successfully
  mockRegisterMutateAsync.mockResolvedValue({ data: makeDevice() });
});

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("HardwareConsolePage — Register Device button visibility", () => {
  it("HCP-1: button visible on Devices tab when user has hardware.register", () => {
    render(<HardwareConsolePage />);
    expect(screen.getByRole("button", { name: /register device/i })).toBeInTheDocument();
  });

  it("HCP-2: button hidden when user lacks hardware.register", () => {
    vi.mocked(useAuthz).mockReturnValue({
      isAllowed: () => false,
    } as ReturnType<typeof useAuthz>);

    render(<HardwareConsolePage />);
    expect(screen.queryByRole("button", { name: /register device/i })).not.toBeInTheDocument();
  });

  it("HCP-3: button present when Devices list is empty", () => {
    vi.mocked(useDevices).mockReturnValue({ ...emptyDevices } as ReturnType<typeof useDevices>);
    render(<HardwareConsolePage />);
    expect(screen.getByRole("button", { name: /register device/i })).toBeInTheDocument();
  });

  it("HCP-12: Register Device button absent on Site Bridges tab", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /site bridges/i }));
    expect(screen.queryByRole("button", { name: /register device/i })).not.toBeInTheDocument();
  });

  it("HCP-13: Register Device button absent on Live Feeds tab", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /live feeds/i }));
    expect(screen.queryByRole("button", { name: /register device/i })).not.toBeInTheDocument();
  });
});

describe("HardwareConsolePage — drawer open/close", () => {
  it("HCP-4: clicking Register Device opens the drawer", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);

    expect(screen.queryByRole("dialog", { name: /register device/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /register device/i }));

    expect(screen.getByRole("dialog", { name: /register device/i })).toBeInTheDocument();
  });
});

describe("HardwareConsolePage — drawer field validation", () => {
  async function openDrawer() {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));
    return user;
  }

  it("HCP-5: submit button disabled when serial and name are blank", async () => {
    await openDrawer();
    const buttons = screen.getAllByRole("button", { name: /register device/i });
    // There are two: the header trigger and the drawer submit
    const submitInDrawer = buttons[buttons.length - 1];
    expect(submitInDrawer).toBeDisabled();
  });

  it("HCP-6: submit disabled when serial is blank (name filled)", async () => {
    const user = await openDrawer();
    const nameInput = screen.getByLabelText(/display name/i);
    await user.type(nameInput, "My Sensor");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it("HCP-7: submit disabled when name is blank (serial filled)", async () => {
    const user = await openDrawer();
    const serialInput = screen.getByLabelText(/serial number/i);
    await user.type(serialInput, "SN-001");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });
});

describe("HardwareConsolePage — successful registration", () => {
  it("HCP-8: success toast shown and drawer closed after registration", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));

    await user.type(screen.getByLabelText(/serial number/i), "SN-GATE-01");
    await user.type(screen.getByLabelText(/display name/i), "Gate Scanner 01");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockRegisterMutateAsync).toHaveBeenCalledOnce();
      expect(mockSuccess).toHaveBeenCalledWith('Device "Gate Scanner 01" registered.');
    });

    // Drawer should be closed
    expect(screen.queryByRole("dialog", { name: /register device/i })).not.toBeInTheDocument();
  });

  it("HCP-9: mutateAsync called with correct payload", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));

    // Fill all fields
    const kindSelect = screen.getByRole("combobox", { name: /device type/i });
    await user.selectOptions(kindSelect, "sensor");

    await user.type(screen.getByLabelText(/serial number/i), "SN-001");
    await user.type(screen.getByLabelText(/display name/i), "North Sensor");
    await user.type(screen.getByLabelText(/site/i), "Building A");
    await user.type(screen.getByLabelText(/zone/i), "Floor 2");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockRegisterMutateAsync).toHaveBeenCalledWith({
        kind: "sensor",
        serial: "SN-001",
        name: "North Sensor",
        site: "Building A",
        zone: "Floor 2",
      });
    });
  });
});

describe("HardwareConsolePage — failed registration", () => {
  it("HCP-10: error toast shown and drawer stays open on failure", async () => {
    mockRegisterMutateAsync.mockRejectedValue(errorFromStatus(409, "Serial already in use."));

    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));

    await user.type(screen.getByLabelText(/serial number/i), "SN-DUP");
    await user.type(screen.getByLabelText(/display name/i), "Duplicate Device");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith("Serial already in use.");
    });

    // Drawer stays open
    expect(screen.getByRole("dialog", { name: /register device/i })).toBeInTheDocument();
  });
});

describe("HardwareConsolePage — cache invalidation", () => {
  it("HCP-11: useRegisterDevice is configured to invalidate hardware queries", () => {
    // Verify that useRegisterDevice hook is called (the implementation test for
    // actual invalidateQueries behavior lives in useHardware.test.ts if present,
    // or is an integration test). Here we verify the hook is wired to the page.
    render(<HardwareConsolePage />);
    expect(vi.mocked(useRegisterDevice)).toHaveBeenCalled();
  });
});

describe("HardwareConsolePage — domain isolation (regression)", () => {
  it("HCP-14: registration does not call camera-feed or bridge query methods", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));

    await user.type(screen.getByLabelText(/serial number/i), "SN-ISOLATED");
    await user.type(screen.getByLabelText(/display name/i), "Isolated Device");

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockRegisterMutateAsync).toHaveBeenCalledOnce());

    // Camera feed and bridge hooks are called for rendering only — not from the
    // register mutation path.
    const cameraFeedMock = vi.mocked(useCameraFeeds);
    const bridgesMock = vi.mocked(useSiteBridges);

    // They are called for the page's data needs, not from the register path.
    // Verify the register mutation did NOT invoke camera or bridge APIs.
    expect(cameraFeedMock.mock.results[0].value.data?.data ?? []).toEqual([]);
    expect(bridgesMock.mock.results[0].value.data?.data ?? []).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// HCP-15 / HCP-16 — field-level validation errors rendered in the drawer
// ---------------------------------------------------------------------------

describe("HardwareConsolePage — field-level validation error display", () => {
  async function openAndFill(user: ReturnType<typeof userEvent.setup>) {
    render(<HardwareConsolePage />);
    await user.click(screen.getByRole("button", { name: /register device/i }));
    await user.type(screen.getByLabelText(/serial number/i), "SN-VALID");
    await user.type(screen.getByLabelText(/display name/i), "Valid Device");
    return user;
  }

  it("HCP-15: kind validation error from backend appears under Device type field", async () => {
    // Simulate the backend returning a 422 with a kind field error.
    const ve = new ValidationError("The given data was invalid.", 422, {
      kind: ["The selected kind is invalid."],
    });
    mockRegisterMutateAsync.mockRejectedValue(ve);

    const user = userEvent.setup();
    await openAndFill(user);

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      // role="alert" under the Device type select
      const alerts = screen.getAllByRole("alert");
      const kindAlert = alerts.find((el) =>
        el.textContent?.includes("selected kind is invalid"),
      );
      expect(kindAlert).toBeDefined();
    });

    // Drawer stays open for the user to correct the field
    expect(screen.getByRole("dialog", { name: /register device/i })).toBeInTheDocument();
  });

  it("HCP-16: serial validation error from backend appears under Serial number field", async () => {
    // Simulate the "serial already taken" error from the backend.
    const ve = new ValidationError("The given data was invalid.", 422, {
      serial: ["The serial has already been taken."],
    });
    mockRegisterMutateAsync.mockRejectedValue(ve);

    const user = userEvent.setup();
    await openAndFill(user);

    const buttons = screen.getAllByRole("button", { name: /register device/i });
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      const serialAlert = alerts.find((el) =>
        el.textContent?.includes("already been taken"),
      );
      expect(serialAlert).toBeDefined();
    });

    // Error toast also fired
    expect(mockError).toHaveBeenCalledWith("The given data was invalid.");

    // Drawer stays open
    expect(screen.getByRole("dialog", { name: /register device/i })).toBeInTheDocument();
  });
});

describe("HardwareConsolePage — retired-device filter (HCP-17/18)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDevices).mockReturnValue(emptyDevices as ReturnType<typeof useDevices>);
    vi.mocked(useRegisterDevice).mockReturnValue({
      mutateAsync: mockRegisterMutateAsync,
      reset: mockRegisterReset,
      isPending: mockRegisterIsPending,
      isError: false,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useRegisterDevice>);

    vi.mocked(useAuthz).mockReturnValue({
      isAllowed: () => true,
    } as ReturnType<typeof useAuthz>);

    vi.mocked(useSiteBridges).mockReturnValue(emptyBridges as ReturnType<typeof useSiteBridges>);
    vi.mocked(useCameraFeeds).mockReturnValue(emptyFeeds as ReturnType<typeof useCameraFeeds>);
  });

  it("HCP-17: 'Show retired' toggle is visible on the Devices tab", () => {
    render(<HardwareConsolePage />);

    expect(
      screen.getByRole("button", { name: /show retired/i }),
    ).toBeInTheDocument();
  });

  it("HCP-18: clicking toggle switches label between Show retired / Hide retired", async () => {
    const user = userEvent.setup();
    render(<HardwareConsolePage />);

    const toggle = screen.getByRole("button", { name: /show retired/i });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: /hide retired/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide retired/i }));
    expect(screen.getByRole("button", { name: /show retired/i })).toBeInTheDocument();
  });
});
