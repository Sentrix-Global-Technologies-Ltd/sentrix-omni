/**
 * AddBuildingModal.test.tsx
 *
 * Tests: AM1-AM8
 * Covers: prefill from draw rect, form state on open/close, cancel behaviour,
 *         save mutation flow, error preservation for retry.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorFromStatus, SAFE_MESSAGES } from "../../../services/api/errors";
import AddBuildingModal from "./AddBuildingModal";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock toast so tests don't need a provider.
const mockSuccess = vi.fn();
const mockError   = vi.fn();
vi.mock("../../../components/shared/toast", () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
}));

// Mock useFacilityActions so tests don't need QueryClientProvider.
const mockMutateAsync = vi.fn();
const mockIsPending   = { value: false };

vi.mock("../hooks/useFacilityMap", () => ({
  useFacilityActions: () => ({
    createBuilding: {
      mutateAsync: mockMutateAsync,
      isPending: mockIsPending.value,
    },
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const noop = () => {};

function renderModal(props: Partial<Parameters<typeof AddBuildingModal>[0]> = {}) {
  return render(<AddBuildingModal open={true} onClose={noop} {...props} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockIsPending.value = false;
});

describe("AddBuildingModal", () => {
  // AM1: renders with default placeholder values when no prefill
  it("AM1 — default coordinate fields shown without initialRect", () => {
    renderModal();
    // Subtitle mentions percentages
    expect(screen.getByText(/percentages of the map canvas/i)).toBeTruthy();
    // Default numeric fields present (10, 25, 25)
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBe(4); // x, y, width, height
  });

  // AM2: prefill from draw rect populates coordinate inputs
  it("AM2 — initialRect populates x/y/width/height fields", () => {
    renderModal({ initialRect: { x: 20, y: 15, width: 35, height: 40 } });
    // Subtitle switches to prefilled message
    expect(screen.getByText(/Coordinates prefilled/i)).toBeTruthy();
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    // inputs order: x, y, width, height (DOM order in the grid)
    expect(Number(inputs[0].value)).toBe(20);
    expect(Number(inputs[1].value)).toBe(15);
    expect(Number(inputs[2].value)).toBe(35);
    expect(Number(inputs[3].value)).toBe(40);
  });

  // AM3: cancel button calls onClose without invoking mutation
  it("AM3 — cancel calls onClose and does not call mutation", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  // AM4: Add building button is disabled until name is entered
  it("AM4 — submit disabled when name is empty", () => {
    renderModal();
    const addBtn = screen.getByRole("button", { name: /add building/i });
    expect(addBtn).toHaveProperty("disabled", true);
  });

  // AM5: entering a name enables the submit button
  it("AM5 — entering name enables submit button", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText("Building A");
    fireEvent.change(nameInput, { target: { value: "North Wing" } });
    const addBtn = screen.getByRole("button", { name: /add building/i });
    expect(addBtn).toHaveProperty("disabled", false);
  });

  // AM6: successful save — mutateAsync called with correct payload
  it("AM6 — successful save calls mutateAsync with form values", async () => {
    mockMutateAsync.mockResolvedValue({});
    const onClose = vi.fn();
    renderModal({
      onClose,
      initialRect: { x: 20, y: 15, width: 35, height: 40 },
    });
    fireEvent.change(screen.getByPlaceholderText("Building A"), {
      target: { value: "East Block" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add building/i }));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledOnce());
    expect(mockMutateAsync).toHaveBeenCalledWith({
      name: "East Block",
      x: 20,
      y: 15,
      width: 35,
      height: 40,
    });
    expect(mockSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  // AM7: failed save — error toast shown, modal stays open (user can retry)
  it("AM7 — failed save shows error toast and keeps modal open", async () => {
    // A 5xx carries server text that must NOT reach the user.
    mockMutateAsync.mockRejectedValue(errorFromStatus(500, "Server error: SQLSTATE[42P01] relation \"buildings\" does not exist"));
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.change(screen.getByPlaceholderText("Building A"), {
      target: { value: "West Wing" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add building/i }));
    await waitFor(() => expect(mockError).toHaveBeenCalledOnce());
    expect(mockError).toHaveBeenCalledWith(SAFE_MESSAGES.generic);
    expect(mockError).not.toHaveBeenCalledWith(expect.stringMatching(/SQLSTATE|relation/));
    // Modal did NOT close — user can retry
    expect(onClose).not.toHaveBeenCalled();
  });

  // AM8: prefill re-syncs when initialRect changes between opens
  it("AM8 — re-opening with different initialRect updates fields", () => {
    const { rerender } = render(
      <AddBuildingModal open={false} onClose={noop} initialRect={{ x: 5, y: 5, width: 10, height: 10 }} />
    );
    // Open with first rect
    rerender(
      <AddBuildingModal open={true} onClose={noop} initialRect={{ x: 5, y: 5, width: 10, height: 10 }} />
    );
    let inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(Number(inputs[0].value)).toBe(5);

    // Close, then open with a different rect
    rerender(
      <AddBuildingModal open={false} onClose={noop} initialRect={{ x: 60, y: 70, width: 20, height: 15 }} />
    );
    rerender(
      <AddBuildingModal open={true} onClose={noop} initialRect={{ x: 60, y: 70, width: 20, height: 15 }} />
    );
    inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(Number(inputs[0].value)).toBe(60);
    expect(Number(inputs[1].value)).toBe(70);
  });
});
