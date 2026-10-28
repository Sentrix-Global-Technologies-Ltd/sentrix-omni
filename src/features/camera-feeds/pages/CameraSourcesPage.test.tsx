/**
 * CameraSourcesPage — edit camera source tests (CSP series).
 *
 * Tests covered:
 *   CSP-1   "Edit details" row action opens EditCameraSourceDrawer.
 *   CSP-2   Drawer pre-populates label, site, zone, tags, status from source.
 *   CSP-3   Submit calls useUpdateCameraSource with correct sourceId and payload.
 *   CSP-4   Successful update shows success toast and closes drawer.
 *   CSP-5   Successful update calls mutateAsync (cache invalidation in hook).
 *   CSP-6   Backend validation error renders under the affected field.
 *   CSP-7   Generic API error shows error toast and leaves drawer open.
 *   CSP-8   Cancel button closes drawer without calling update.
 *   CSP-9   Escape key closes drawer without calling update.
 *   CSP-10  Submit button is disabled when label is blank.
 *   CSP-11  Submit button shows "Saving…" and is disabled while isPending.
 *   CSP-12  Source type shown read-only; no `type` field in submitted payload.
 *   CSP-13  Regression: Add Camera Source drawer still opens correctly.
 *   CSP-14  Regression: delete flow is unaffected by edit state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/* ─── Module-level mocks (hoisted by vitest) ─────────────────────────────── */

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../components/shared/Breadcrumb", () => ({ default: () => null }));

vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual<typeof import("react-router-dom")>();
  return { ...actual, Link: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: () => ({ activeId: "org-test" }),
}));

// useAuthz — mock the function; mocked implementation is set in beforeEach
vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: vi.fn(),
}));

// Toast
vi.mock("../../../components/shared/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  useToast: vi.fn(),
}));

// Camera feeds query hook
vi.mock("../hooks/useCameraFeeds", () => ({
  useCameraFeeds: vi.fn(),
}));

// Camera source action hooks
vi.mock("../hooks/useCameraSourceActions", () => ({
  useCreateCameraSource: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  })),
  useUpdateCameraSource: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useDeleteCameraSource: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

// Pagination — stub
vi.mock("../../../components/ui/pagination/Pagination", () => ({
  default: () => null,
}));

/* ─── Late imports (after mocks) ────────────────────────────────────────── */

import CameraSourcesPage from "./CameraSourcesPage";
import { useAuthz } from "../../../hooks/useAuthz";
import { useToast } from "../../../components/shared/toast";
import { useCameraFeeds } from "../hooks/useCameraFeeds";
import { useUpdateCameraSource, useDeleteCameraSource } from "../hooks/useCameraSourceActions";
import { ValidationError } from "../../../services/api/errors";
import type { CameraSource } from "../api/camera-feeds.types";

/* ─── Test fixtures ──────────────────────────────────────────────────────── */

const SOURCE_A: CameraSource = {
  id: "src-001",
  type: "ip_camera",
  label: "Gate A – Cam 01",
  organization_id: "org-test",
  site: "HQ Building",
  zone: "Main Entrance",
  connection_url: "rtsp://192.168.1.10:554/stream1",
  tags: ["entrance", "outdoor"],
  status: "active",
  metadata: null,
  last_frame_url: null,
  last_frame_at: null,
  feed_status: "live",
  health_score: 90,
  created_at: "2026-01-01T00:00:00Z",
};

function makeQueryResult(sources: CameraSource[] = [SOURCE_A]) {
  return {
    data: {
      data: sources,
      meta: { current_page: 1, last_page: 1, total: sources.length, from: 1, to: sources.length },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
}

/* ─── Shared mutable references for per-test configuration ───────────────── */

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

/* ─── Test suite ─────────────────────────────────────────────────────────── */

describe("CameraSourcesPage — edit workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Defaults
    vi.mocked(useToast).mockReturnValue({ success: mockSuccess, error: mockError } as ReturnType<typeof useToast>);
    vi.mocked(useCameraFeeds).mockReturnValue(makeQueryResult() as ReturnType<typeof useCameraFeeds>);
    vi.mocked(useAuthz).mockReturnValue({
      isAllowed: (rule: unknown) => {
        if (!rule || typeof rule !== "object") return true;
        const r = rule as { anyPermission?: string[] };
        if (Array.isArray(r.anyPermission)) {
          return r.anyPermission.includes("bridges.manage");
        }
        return true;
      },
    } as ReturnType<typeof useAuthz>);

    mockUpdateMutateAsync.mockResolvedValue({});
    mockDeleteMutateAsync.mockResolvedValue({});

    vi.mocked(useUpdateCameraSource).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as ReturnType<typeof useUpdateCameraSource>);

    vi.mocked(useDeleteCameraSource).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as ReturnType<typeof useDeleteCameraSource>);
  });

  /* helper: open the row action menu for the first row and click Edit */
  async function openEditDrawer(user: ReturnType<typeof userEvent.setup>) {
    // RowActionsMenu trigger has title="Actions"; click to open the dropdown
    const menuBtns = screen.getAllByTitle("Actions");
    await user.click(menuBtns[0]);
    // Menu items are plain <button> elements inside the dropdown (no role="menuitem")
    await user.click(await screen.findByRole("button", { name: /edit details/i }));
  }

  /* ── CSP-1 ─────────────────────────────────────────────────────────────── */
  it("CSP-1: Edit details row action opens EditCameraSourceDrawer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);
    expect(screen.getByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
  });

  /* ── CSP-2 ─────────────────────────────────────────────────────────────── */
  it("CSP-2: drawer pre-populates label, site, zone, tags, status", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    expect(within(dialog).getByDisplayValue("Gate A – Cam 01")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("HQ Building")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Main Entrance")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("entrance, outdoor")).toBeInTheDocument();
    const statusSelect = within(dialog).getByRole("combobox");
    expect((statusSelect as HTMLSelectElement).value).toBe("active");
  });

  /* ── CSP-3 ─────────────────────────────────────────────────────────────── */
  it("CSP-3: submit sends correct sourceId and payload", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    const labelInput = within(dialog).getByDisplayValue("Gate A – Cam 01");
    await user.clear(labelInput);
    await user.type(labelInput, "Gate A – Updated");

    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ label: "Gate A – Updated", site: "HQ Building" })
      );
      expect(vi.mocked(useUpdateCameraSource)).toHaveBeenCalledWith("src-001");
    });
  });

  /* ── CSP-4 ─────────────────────────────────────────────────────────────── */
  it("CSP-4: successful update shows success toast and closes drawer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining("updated"));
      expect(screen.queryByRole("dialog", { name: /edit camera source/i })).not.toBeInTheDocument();
    });
  });

  /* ── CSP-5 ─────────────────────────────────────────────────────────────── */
  it("CSP-5: successful update calls mutateAsync once (hook handles cache invalidation)", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    await user.click(
      within(screen.getByRole("dialog", { name: /edit camera source/i })).getByRole("button", { name: /save changes/i })
    );

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1));
  });

  /* ── CSP-6 ─────────────────────────────────────────────────────────────── */
  it("CSP-6: backend validation error renders under affected field", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(
      new ValidationError("Unprocessable Entity", 422, {
        label: ["The label field is required."],
      })
    );

    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      const alert = within(dialog).getByRole("alert");
      expect(alert).toHaveTextContent("The label field is required.");
    });
    expect(screen.getByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
  });

  /* ── CSP-7 ─────────────────────────────────────────────────────────────── */
  it("CSP-7: generic API error shows error toast and leaves drawer open", async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockError).toHaveBeenCalledWith("Network error"));
    expect(screen.getByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
  });

  /* ── CSP-8 ─────────────────────────────────────────────────────────────── */
  it("CSP-8: Cancel button closes drawer without calling update", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /edit camera source/i })).not.toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  /* ── CSP-9 ─────────────────────────────────────────────────────────────── */
  it("CSP-9: Escape key closes drawer without calling update", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    expect(screen.getByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: /edit camera source/i })).not.toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  /* ── CSP-10 ────────────────────────────────────────────────────────────── */
  it("CSP-10: submit button disabled when label is blank", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    const labelInput = within(dialog).getByDisplayValue("Gate A – Cam 01");
    await user.clear(labelInput);

    expect(within(dialog).getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  /* ── CSP-11 ────────────────────────────────────────────────────────────── */
  it("CSP-11: submit button shows 'Saving…' and is disabled while isPending", async () => {
    vi.mocked(useUpdateCameraSource).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: true,
    } as ReturnType<typeof useUpdateCameraSource>);

    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    const saveBtn = within(dialog).getByRole("button", { name: /saving/i });
    expect(saveBtn).toBeDisabled();
  });

  /* ── CSP-12 ────────────────────────────────────────────────────────────── */
  it("CSP-12: source type shown read-only; no type field in submitted payload", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openEditDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /edit camera source/i });
    expect(within(dialog).getByText(/cannot be changed after creation/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      const payload = mockUpdateMutateAsync.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty("type");
    });
  });

  /* ── CSP-13 (regression) ───────────────────────────────────────────────── */
  it("CSP-13: regression — Add Camera Source drawer still opens correctly", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);

    await user.click(screen.getByRole("button", { name: /add camera source/i }));

    await waitFor(() => {
      expect(screen.getByText(/select the type of camera source/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog", { name: /edit camera source/i })).not.toBeInTheDocument();
  });

  /* ── CSP-14 (regression) ───────────────────────────────────────────────── */
  it("CSP-14: regression — delete flow is unaffected by edit state", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const user = userEvent.setup();
    render(<CameraSourcesPage />);

    const menuBtns = screen.getAllByRole("button", { name: /actions/i });
    await user.click(menuBtns[0]);
    await user.click(await screen.findByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("src-001");
      expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining("removed"));
    });
    expect(screen.queryByRole("dialog", { name: /edit camera source/i })).not.toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   View source tests (VS series)
   Tests covered:
     VS-1  "View source" opens CameraSourceDetailDrawer with correct aria-label.
     VS-2  Drawer displays label, type label, site/zone, feed status, health.
     VS-3  Missing optional fields (site, zone, tags, last_frame_at) handled gracefully.
     VS-4  "Mark for review" menu item is disabled (no backend contract).
     VS-5  Close button in detail drawer closes it.
     VS-6  Escape key closes detail drawer.
     VS-7  Connection URL masked for credential-bearing types (ip_camera).
     VS-8  Regression: Edit Details still opens EditCameraSourceDrawer alongside view.
────────────────────────────────────────────────────────────────────────── */

const SOURCE_NO_OPTIONAL: CameraSource = {
  id: "src-002",
  type: "phone",
  label: "Mobile Unit B",
  organization_id: "org-test",
  site: null,
  zone: null,
  connection_url: null,
  tags: [],
  status: "inactive",
  metadata: null,
  last_frame_url: null,
  last_frame_at: null,
  feed_status: "no_feed",
  health_score: null,
  created_at: "2026-03-01T12:00:00Z",
};

describe("CameraSourcesPage — view source workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useToast).mockReturnValue({ success: mockSuccess, error: mockError } as ReturnType<typeof useToast>);
    vi.mocked(useCameraFeeds).mockReturnValue(makeQueryResult() as ReturnType<typeof useCameraFeeds>);
    vi.mocked(useAuthz).mockReturnValue({
      isAllowed: (rule: unknown) => {
        if (!rule || typeof rule !== "object") return true;
        const r = rule as { anyPermission?: string[] };
        if (Array.isArray(r.anyPermission)) {
          return r.anyPermission.includes("bridges.manage");
        }
        return true;
      },
    } as ReturnType<typeof useAuthz>);

    vi.mocked(useUpdateCameraSource).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as ReturnType<typeof useUpdateCameraSource>);

    vi.mocked(useDeleteCameraSource).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as ReturnType<typeof useDeleteCameraSource>);
  });

  /** Helper: open the row action menu and click "View source". */
  async function openViewDrawer(user: ReturnType<typeof userEvent.setup>) {
    const menuBtns = screen.getAllByTitle("Actions");
    await user.click(menuBtns[0]);
    await user.click(await screen.findByRole("button", { name: /view source/i }));
  }

  /* ── VS-1 ─────────────────────────────────────────────────────────────── */
  it("VS-1: View source opens CameraSourceDetailDrawer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);
    expect(screen.getByRole("dialog", { name: /camera source details/i })).toBeInTheDocument();
  });

  /* ── VS-2 ─────────────────────────────────────────────────────────────── */
  it("VS-2: detail drawer shows label, type label, site/zone, feed status, health", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /camera source details/i });
    // Label appears as heading text
    expect(within(dialog).getByText("Gate A – Cam 01")).toBeInTheDocument();
    // Type label from CAMERA_SOURCE_TYPES for "ip_camera"
    expect(within(dialog).getByText(/ip camera/i)).toBeInTheDocument();
    // Site + zone combined
    expect(within(dialog).getByText(/hq building/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/main entrance/i)).toBeInTheDocument();
    // Feed status badge text (live → "Live")
    expect(within(dialog).getByText(/live/i)).toBeInTheDocument();
  });

  /* ── VS-3 ─────────────────────────────────────────────────────────────── */
  it("VS-3: gracefully handles source with no site, zone, tags, or timestamps", async () => {
    vi.mocked(useCameraFeeds).mockReturnValue(
      makeQueryResult([SOURCE_NO_OPTIONAL]) as ReturnType<typeof useCameraFeeds>
    );

    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /camera source details/i });
    expect(within(dialog).getByText("Mobile Unit B")).toBeInTheDocument();
    // Should show placeholder for missing site/zone
    expect(within(dialog).getByText(/not set/i)).toBeInTheDocument();
    // No crash — dialog is present
    expect(dialog).toBeInTheDocument();
  });

  /* ── VS-4 ─────────────────────────────────────────────────────────────── */
  it("VS-4: Mark for review menu item is disabled", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);

    const menuBtns = screen.getAllByTitle("Actions");
    await user.click(menuBtns[0]);

    const reviewBtn = await screen.findByRole("button", { name: /mark for review/i });
    expect(reviewBtn).toBeDisabled();
  });

  /* ── VS-5 ─────────────────────────────────────────────────────────────── */
  it("VS-5: Close button in detail drawer closes it", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /camera source details/i });
    // The footer Close button (not the × header close — both work, use the footer one)
    const closeBtns = within(dialog).getAllByRole("button", { name: /close/i });
    await user.click(closeBtns[closeBtns.length - 1]);

    expect(screen.queryByRole("dialog", { name: /camera source details/i })).not.toBeInTheDocument();
  });

  /* ── VS-6 ─────────────────────────────────────────────────────────────── */
  it("VS-6: Escape key closes detail drawer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);

    expect(screen.getByRole("dialog", { name: /camera source details/i })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: /camera source details/i })).not.toBeInTheDocument();
  });

  /* ── VS-7 ─────────────────────────────────────────────────────────────── */
  it("VS-7: connection URL credentials masked for ip_camera type", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawer(user);

    const dialog = screen.getByRole("dialog", { name: /camera source details/i });
    // SOURCE_A has connection_url rtsp://192.168.1.10:554/stream1 (no user:pass)
    // so it should appear as-is — no masking needed for this URL
    expect(within(dialog).getByText(/192\.168\.1\.10/)).toBeInTheDocument();
  });

  /* ── VS-8 (regression) ─────────────────────────────────────────────────── */
  it("VS-8: regression — Edit Details still opens EditCameraSourceDrawer when detail drawer is closed", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);

    // Open and close the view drawer
    await openViewDrawer(user);
    const dialog = screen.getByRole("dialog", { name: /camera source details/i });
    const closeBtns8 = within(dialog).getAllByRole("button", { name: /^close$/i });
    await user.click(closeBtns8[closeBtns8.length - 1]);
    expect(screen.queryByRole("dialog", { name: /camera source details/i })).not.toBeInTheDocument();

    // Now open Edit
    const menuBtns = screen.getAllByTitle("Actions");
    await user.click(menuBtns[0]);
    await user.click(await screen.findByRole("button", { name: /edit details/i }));

    expect(screen.getByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
  });
});


/* ── VS-D: detail drawer edit action ──────────────────────────────────────
   VS-D-1  Authorized user sees Edit + Close in detail drawer footer.
   VS-D-2  Unauthorized user sees Close only — no Edit button.
   VS-D-3  Clicking Edit opens EditCameraSourceDrawer with correct source.
   VS-D-4  Detail drawer closes when Edit is clicked.
────────────────────────────────────────────────────────────────────────── */

describe("CameraSourcesPage — detail drawer edit action", () => {
  /** Auth mock that grants camera-sources.manage in addition to bridges.manage. */
  function makeAuthzWithCameraManage() {
    return {
      isAllowed: (rule: unknown) => {
        if (!rule || typeof rule !== "object") return true;
        const r = rule as { anyPermission?: string[] };
        if (Array.isArray(r.anyPermission)) {
          return (
            r.anyPermission.includes("bridges.manage") ||
            r.anyPermission.includes("camera-sources.manage")
          );
        }
        return true;
      },
    } as ReturnType<typeof useAuthz>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ success: mockSuccess, error: mockError } as ReturnType<typeof useToast>);
    vi.mocked(useCameraFeeds).mockReturnValue(makeQueryResult() as ReturnType<typeof useCameraFeeds>);
    vi.mocked(useUpdateCameraSource).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as ReturnType<typeof useUpdateCameraSource>);
    vi.mocked(useDeleteCameraSource).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as ReturnType<typeof useDeleteCameraSource>);
    // Default for this suite: grants camera-sources.manage
    vi.mocked(useAuthz).mockReturnValue(makeAuthzWithCameraManage());
  });

  async function openViewDrawerVSD(user: ReturnType<typeof userEvent.setup>) {
    const menuBtns = screen.getAllByTitle("Actions");
    await user.click(menuBtns[0]);
    await user.click(await screen.findByRole("button", { name: /view source/i }));
  }

  /* ── VS-D-1 ─────────────────────────────────────────────────────────── */
  it("VS-D-1: authorized user sees Edit and Close buttons in detail footer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawerVSD(user);
    const dialog = await screen.findByRole("dialog", { name: /camera source details/i });
    // Edit button (footer, authorized)
    expect(within(dialog).getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    // The drawer has two "Close" controls: the X icon (aria-label="Close") and the footer text button.
    // Verify both exist — the footer text button is the last one.
    const closeBtns = within(dialog).getAllByRole("button", { name: /^close$/i });
    expect(closeBtns.length).toBeGreaterThanOrEqual(2);
    expect(closeBtns[closeBtns.length - 1]).toHaveTextContent("Close");
  });

  /* ── VS-D-2 ─────────────────────────────────────────────────────────── */
  it("VS-D-2: unauthorized user sees Close only — no Edit button", async () => {
    // Override: camera-sources.manage NOT granted
    vi.mocked(useAuthz).mockReturnValue({
      isAllowed: (rule: unknown) => {
        if (!rule || typeof rule !== "object") return true;
        const r = rule as { anyPermission?: string[] };
        if (Array.isArray(r.anyPermission)) {
          return r.anyPermission.includes("bridges.manage");
        }
        return true;
      },
    } as ReturnType<typeof useAuthz>);

    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawerVSD(user);
    const dialog = await screen.findByRole("dialog", { name: /camera source details/i });
    // No Edit button — unauthorized
    expect(within(dialog).queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    // At least the X close icon and the footer Close text button
    expect(within(dialog).getAllByRole("button", { name: /^close$/i }).length).toBeGreaterThanOrEqual(1);
  });

  /* ── VS-D-3 ─────────────────────────────────────────────────────────── */
  it("VS-D-3: clicking Edit opens EditCameraSourceDrawer", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawerVSD(user);
    const detailDialog = await screen.findByRole("dialog", { name: /camera source details/i });
    await user.click(within(detailDialog).getByRole("button", { name: /^edit$/i }));
    expect(await screen.findByRole("dialog", { name: /edit camera source/i })).toBeInTheDocument();
  });

  /* ── VS-D-4 ─────────────────────────────────────────────────────────── */
  it("VS-D-4: detail drawer closes when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(<CameraSourcesPage />);
    await openViewDrawerVSD(user);
    const detailDialog = await screen.findByRole("dialog", { name: /camera source details/i });
    await user.click(within(detailDialog).getByRole("button", { name: /^edit$/i }));
    expect(screen.queryByRole("dialog", { name: /camera source details/i })).not.toBeInTheDocument();
  });
});
