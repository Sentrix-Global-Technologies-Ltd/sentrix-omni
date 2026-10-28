/**
 * DeviceActions — device lifecycle transition tests (DT-F series).
 *
 * The actions are now behind a three-dot menu (aria-label "Device actions").
 * Tests open the menu before checking for action items.
 *
 * DT-F-1  hardware.manage user on active device: menu shows Set Maintenance + Retire.
 * DT-F-2  hardware.manage user on maintenance device: menu shows Return to Active + Retire; no Set Maintenance.
 * DT-F-3  hardware.manage user on retired device: menu shows no transition items (terminal).
 * DT-F-4  User WITHOUT hardware.manage: menu shows no transition items.
 * DT-F-5  "Set Maintenance" confirm dialog requires a non-empty reason.
 * DT-F-6  Confirming a maintenance transition calls the transition API mutation.
 * DT-F-7  Successful transition shows success toast.
 * DT-F-8  deviceStatusTone returns "warning" for maintenance.
 * DT-F-9  deviceStatusTone returns "light" for retired.
 *
 * Diagnosis feedback (DT-F-10 to DT-F-15):
 * DT-F-10  decommissioned health (retired device) → correct feedback toast.
 * DT-F-11  maintenance health (maintenance device) → correct feedback toast.
 * DT-F-12  online health (active device) → correct feedback toast.
 * DT-F-13  stale health (active device, no last_seen_at) → correct feedback toast.
 * DT-F-14  offline health (offline device) → correct feedback toast.
 * DT-F-15  unexpected health value → defensive fallback; does not claim device is healthy.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceActions from "./DeviceActions";
import { deviceStatusTone } from "./deviceTone";
import type { Device } from "../api/hardware.types";

/* ─── Mocks ─────────────────────────────────────────────────────────────── */

vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: vi.fn(),
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("../../../components/shared/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: () => ({ activeId: "org-test" }),
}));

const mockResync = vi.fn().mockResolvedValue({});
const mockDiagnose = vi.fn().mockResolvedValue({});
const mockTransition = vi.fn().mockResolvedValue({});

vi.mock("../hooks/useHardware", () => ({
  useDeviceActions: vi.fn(() => ({
    resync: { mutateAsync: mockResync, isPending: false },
    diagnose: { mutateAsync: mockDiagnose, isPending: false },
  })),
  useTransitionDeviceStatus: vi.fn(() => ({
    mutateAsync: mockTransition,
    isPending: false,
  })),
}));

/* ─── Helpers ────────────────────────────────────────────────────────────── */

import { useAuthz } from "../../../hooks/useAuthz";

function makeDevice(status: string, overrides: Partial<Device> = {}): Device {
  return {
    id: "dev-1",
    organization_id: "org-test",
    registered_by: null,
    kind: "gate_scanner",
    serial: "GS-001",
    name: "Main Gate",
    site: "HQ",
    zone: "Entrance",
    status,
    last_seen_at: null,
    metadata: null,
    created_at: null,
    ...overrides,
  };
}

function grantManage() {
  vi.mocked(useAuthz).mockReturnValue({
    isAllowed: (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      return r?.anyPermission?.some((p) =>
        ["hardware.resync", "hardware.diagnose", "hardware.manage"].includes(p),
      ) ?? false;
    },
  } as ReturnType<typeof useAuthz>);
}

function denyManage() {
  vi.mocked(useAuthz).mockReturnValue({
    isAllowed: (rule: unknown) => {
      const r = rule as { anyPermission?: string[] };
      return r?.anyPermission?.some((p) =>
        ["hardware.resync", "hardware.diagnose"].includes(p),
      ) ?? false;
    },
  } as ReturnType<typeof useAuthz>);
}

/** Opens the three-dot menu for the rendered DeviceActions. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /device actions/i }));
}

/* ─── Tests ─────────────────────────────────────────────────────────────── */

describe("DeviceActions — deviceStatusTone", () => {
  it("DT-F-8: returns warning for maintenance", () => {
    expect(deviceStatusTone("maintenance")).toBe("warning");
  });

  it("DT-F-9: returns light for retired", () => {
    expect(deviceStatusTone("retired")).toBe("light");
  });
});

describe("DeviceActions — transition controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DT-F-1: active device menu shows Set Maintenance and Retire for hardware.manage user", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("active")} />);

    await openMenu(user);

    expect(screen.getByRole("button", { name: /set maintenance/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^retire$/i })).toBeInTheDocument();
  });

  it("DT-F-2: maintenance device menu shows Return to Active and Retire; no Set Maintenance", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("maintenance")} />);

    await openMenu(user);

    expect(screen.getByRole("button", { name: /return to active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^retire$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /set maintenance/i })).not.toBeInTheDocument();
  });

  it("DT-F-3: retired device menu shows no transition items (terminal)", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("retired")} />);

    await openMenu(user);

    expect(screen.queryByRole("button", { name: /set maintenance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^retire$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /return to active/i })).not.toBeInTheDocument();
  });

  it("DT-F-4: user without hardware.manage sees no transition items in menu", async () => {
    denyManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("active")} />);

    await openMenu(user);

    expect(screen.queryByRole("button", { name: /set maintenance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^retire$/i })).not.toBeInTheDocument();
  });

  it("DT-F-5: Set Maintenance confirm dialog requires non-empty reason before submit", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("active")} />);

    // Open menu → click Set Maintenance → dialog opens
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /set maintenance/i }));

    // Dialog confirm button (the only "Set Maintenance" button now — menu is closed)
    const confirmBtn = screen.getByRole("button", { name: /set maintenance/i });

    // Submit with empty reason — mutation must NOT be called
    await user.click(confirmBtn);
    expect(mockTransition).not.toHaveBeenCalled();

    // Validation error appears
    expect(await screen.findByText(/a reason is required/i)).toBeInTheDocument();
  });

  it("DT-F-6: confirming maintenance transition calls transition mutateAsync with correct payload", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("active")} />);

    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /set maintenance/i }));

    // Fill reason textarea
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Scheduled firmware upgrade.");

    // Confirm (only one "Set Maintenance" button now — the dialog confirm)
    await user.click(screen.getByRole("button", { name: /set maintenance/i }));

    await waitFor(() => {
      expect(mockTransition).toHaveBeenCalledWith({
        status: "maintenance",
        reason: "Scheduled firmware upgrade.",
      });
    });
  });

  it("DT-F-7: successful transition shows success toast", async () => {
    grantManage();
    const user = userEvent.setup();
    render(<DeviceActions device={makeDevice("active")} />);

    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /set maintenance/i }));

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Reason for transition.");

    await user.click(screen.getByRole("button", { name: /set maintenance/i }));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
    });
  });
});

describe("DeviceActions — diagnosis feedback (DT-F-10 to DT-F-15)", () => {
  /**
   * Opens the three-dot menu, clicks "Diagnose" in the dropdown (closes the menu),
   * then clicks the "Diagnose" confirm button in the dialog that opens.
   */
  async function runDiagnose(
    user: ReturnType<typeof userEvent.setup>,
    device: ReturnType<typeof makeDevice>,
  ) {
    render(<DeviceActions device={device} />);
    await openMenu(user);
    // Click "Diagnose" in the dropdown — menu closes, dialog opens
    await user.click(screen.getByRole("button", { name: /^diagnose$/i }));
    // Wait for dialog confirm button, then click it
    const confirmBtn = await screen.findByRole("button", { name: /^diagnose$/i });
    await user.click(confirmBtn);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    grantManage();
  });

  it("DT-F-10: decommissioned health from retired device shows correct feedback", async () => {
    mockDiagnose.mockResolvedValueOnce({
      data: { status: "retired", last_seen_at: null, health: "decommissioned" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("retired"));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Device is retired and decommissioned.");
    });
  });

  it("DT-F-11: maintenance health from maintenance device shows correct feedback", async () => {
    mockDiagnose.mockResolvedValueOnce({
      data: { status: "maintenance", last_seen_at: null, health: "maintenance" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("maintenance"));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Device is in scheduled maintenance.");
    });
  });

  it("DT-F-12: online health from active device shows correct feedback", async () => {
    mockDiagnose.mockResolvedValueOnce({
      data: { status: "active", last_seen_at: new Date().toISOString(), health: "online" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("active"));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Device is online and reporting normally.");
    });
  });

  it("DT-F-13: stale health shows correct feedback (active device, no recent heartbeat)", async () => {
    mockDiagnose.mockResolvedValueOnce({
      data: { status: "active", last_seen_at: null, health: "stale" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("active"));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(
        "Device is active but its heartbeat is overdue — it may not be responding.",
      );
    });
  });

  it("DT-F-14: offline health from offline device shows correct feedback", async () => {
    mockDiagnose.mockResolvedValueOnce({
      data: { status: "offline", last_seen_at: null, health: "offline" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("offline"));
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith("Device has lost connectivity and is no longer reporting to the system.");
    });
  });

  it("DT-F-15: unexpected health value produces defensive fallback without claiming device is healthy", async () => {
    mockDiagnose.mockResolvedValueOnce({
      // Simulate a future backend health value not yet known to the frontend
      data: { status: "active", last_seen_at: null, health: "some_future_value" },
      message: "Success",
    });
    const user = userEvent.setup();
    await runDiagnose(user, makeDevice("active"));
    await waitFor(() => {
      // Must include the raw value so the operator can investigate
      expect(mockSuccess).toHaveBeenCalledWith(
        expect.stringContaining("some_future_value"),
      );
      // Must NOT claim the device is healthy
      expect(mockSuccess).not.toHaveBeenCalledWith(
        expect.stringContaining("healthy"),
      );
    });
  });
});

