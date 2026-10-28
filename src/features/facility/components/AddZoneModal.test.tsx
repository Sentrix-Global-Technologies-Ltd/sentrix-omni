/**
 * AddZoneModal — tests (AZM01–AZM28)
 *
 * Tests cover:
 *   AZM01–AZM12  advanced-toggle behaviour (Batch 2-F)
 *   AZM13–AZM23  boundary validation (Batch 2-G)
 *   AZM24–AZM28  zone overlap validation (Batch 2-H)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddZoneModal from "./AddZoneModal";
import type { FacilityZone } from "../api/facility.types";

// ── Minimal stubs ────────────────────────────────────────────────────────────

vi.mock("../../../components/ui/modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock("../../../components/ui/button/Button", () => ({
  default: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const toastSuccess = vi.fn();
const toastError   = vi.fn();
vi.mock("../../../components/shared/toast", () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

const mutateMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../hooks/useFacilityMap", () => ({
  useFacilityActions: () => ({
    createZone: { mutateAsync: mutateMock, isPending: false },
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  buildingId: "b1",
  buildingName: "Block A",
};

const drawnRect = { x: 15, y: 20, width: 40, height: 25 };

function makeZone(id: string, x: number, y: number, width: number, height: number, name = `Zone ${id}`): FacilityZone {
  return { id, name, x, y, width, height, cameras_total: 0, cameras_online: 0, cameras: [] };
}

function openAdvanced() {
  fireEvent.click(screen.getByTestId("advanced-toggle"));
}

function setField(testId: string, value: number) {
  fireEvent.change(screen.getByTestId(testId) as HTMLInputElement, { target: { value: String(value) } });
}

// ── Toggle tests (AZM01–AZM12) ───────────────────────────────────────────────

describe("AddZoneModal — advanced toggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AZM01: renders name field when open", () => {
    render(<AddZoneModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/entrance/i)).toBeDefined();
  });

  it("AZM02: advanced fields hidden by default when initialRect provided", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    expect(screen.queryByTestId("advanced-fields")).toBeNull();
  });

  it("AZM03: advanced fields shown by default when no initialRect", () => {
    render(<AddZoneModal {...defaultProps} />);
    expect(screen.queryByTestId("advanced-fields")).toBeDefined();
  });

  it("AZM04: clicking toggle reveals advanced fields", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    const toggle = screen.getByTestId("advanced-toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByTestId("advanced-fields")).toBeDefined();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("AZM05: clicking toggle again hides advanced fields", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    openAdvanced();
    fireEvent.click(screen.getByTestId("advanced-toggle"));
    expect(screen.queryByTestId("advanced-fields")).toBeNull();
  });

  it("AZM06: advanced fields pre-filled from initialRect values", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    openAdvanced();
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs[0].value).toBe(String(Math.round(drawnRect.x)));
    expect(inputs[1].value).toBe(String(Math.round(drawnRect.y)));
    expect(inputs[2].value).toBe(String(Math.round(drawnRect.width)));
    expect(inputs[3].value).toBe(String(Math.round(drawnRect.height)));
  });

  it("AZM07: default coordinates shown when no initialRect", () => {
    render(<AddZoneModal {...defaultProps} />);
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs[0].value).toBe("10");
    expect(inputs[1].value).toBe("10");
    expect(inputs[2].value).toBe("30");
    expect(inputs[3].value).toBe("30");
  });

  it("AZM08: collapsed toggle shows coord summary", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    expect(screen.getByTestId("advanced-toggle").textContent).toContain("15%");
  });

  it("AZM09: Add zone button disabled when name is empty", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    expect((screen.getByRole("button", { name: /add zone/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("AZM10: Add zone button enabled once name is typed and geometry is valid", () => {
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} />);
    fireEvent.change(screen.getByPlaceholderText(/entrance/i), { target: { value: "Lobby" } });
    expect((screen.getByRole("button", { name: /add zone/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("AZM11: nothing rendered when open=false", () => {
    render(<AddZoneModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("AZM12: advanced section resets to hidden on re-open with initialRect", () => {
    const { rerender } = render(<AddZoneModal {...defaultProps} open={false} initialRect={drawnRect} />);
    rerender(<AddZoneModal {...defaultProps} open={true} initialRect={null} />);
    expect(screen.queryByTestId("advanced-fields")).toBeDefined();
    rerender(<AddZoneModal {...defaultProps} open={false} initialRect={null} />);
    rerender(<AddZoneModal {...defaultProps} open={true} initialRect={drawnRect} />);
    expect(screen.queryByTestId("advanced-fields")).toBeNull();
  });
});

// ── Boundary validation tests (AZM13–AZM23) ──────────────────────────────────

describe("AddZoneModal — boundary validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AZM13: y=90 + height=30 shows 'extends past bottom edge' error", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 60); setField("field-y", 90);
    setField("field-width", 30); setField("field-height", 30);
    expect(screen.getByTestId("validation-error").textContent).toMatch(/bottom edge/i);
  });

  it("AZM14: submit disabled when geometry is invalid", () => {
    render(<AddZoneModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/entrance/i), { target: { value: "Refectory" } });
    setField("field-x", 60); setField("field-y", 90);
    setField("field-width", 30); setField("field-height", 30);
    expect((screen.getByRole("button", { name: /add zone/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("AZM15: x+width=100 is valid (right-edge aligned)", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 60); setField("field-y", 10);
    setField("field-width", 40); setField("field-height", 30);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });

  it("AZM16: y+height=100 is valid (bottom-edge aligned)", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 10); setField("field-y", 70);
    setField("field-width", 30); setField("field-height", 30);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });

  it("AZM17: x+width=101 shows right-edge error", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 1); setField("field-y", 10);
    setField("field-width", 100); setField("field-height", 20);
    expect(screen.getByTestId("validation-error").textContent).toMatch(/right edge/i);
  });

  it("AZM18: width below MIN_ZONE_SIZE_PCT shows min-size error", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 10); setField("field-y", 10);
    setField("field-width", 1); setField("field-height", 20);
    expect(screen.getByTestId("validation-error").textContent).toMatch(/width must be at least/i);
  });

  it("AZM19: height below MIN_ZONE_SIZE_PCT shows min-size error", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 10); setField("field-y", 10);
    setField("field-width", 20); setField("field-height", 1);
    expect(screen.getByTestId("validation-error").textContent).toMatch(/height must be at least/i);
  });

  it("AZM20: x=0 y=0 w=100 h=100 (full building) is valid", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 0); setField("field-y", 0);
    setField("field-width", 100); setField("field-height", 100);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });

  it("AZM21: minimum-size zone x=0 y=0 w=2 h=2 is valid", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 0); setField("field-y", 0);
    setField("field-width", 2); setField("field-height", 2);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });

  it("AZM22: live preview renders when advanced fields are visible", () => {
    render(<AddZoneModal {...defaultProps} />);
    expect(screen.getByTestId("zone-preview")).toBeDefined();
    expect(screen.getByTestId("zone-preview-rect")).toBeDefined();
  });

  it("AZM23: error clears after correcting the offending field", () => {
    render(<AddZoneModal {...defaultProps} />);
    setField("field-x", 60); setField("field-y", 90);
    setField("field-width", 30); setField("field-height", 30);
    expect(screen.getByTestId("validation-error")).toBeDefined();
    setField("field-height", 10); // y=90+h=10 → 100 ✓
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });
});

// ── Overlap validation tests (AZM24–AZM28) ───────────────────────────────────

describe("AddZoneModal — zone overlap validation", () => {
  beforeEach(() => vi.clearAllMocks());

  // A building that already has two zones
  const existingZones: FacilityZone[] = [
    makeZone("z1", 10, 10, 30, 30, "Lobby"),        // (10,10) → (40,40)
    makeZone("z2", 50, 50, 30, 30, "Server Room"),   // (50,50) → (80,80)
  ];

  // AZM24: a rect that fully overlaps Lobby → error shown
  it("AZM24: new zone overlapping existing zone shows overlap error", () => {
    render(<AddZoneModal {...defaultProps} existingZones={existingZones} />);
    // Default coords 10,10,30,30 exactly match Lobby → overlap
    expect(screen.getByTestId("validation-error").textContent).toMatch(/overlaps "Lobby"/i);
  });

  // AZM25: submit is disabled when overlap error exists
  it("AZM25: submit button disabled when overlap is detected", () => {
    render(<AddZoneModal {...defaultProps} existingZones={existingZones} />);
    fireEvent.change(screen.getByPlaceholderText(/entrance/i), { target: { value: "Refectory" } });
    // Default x=10,y=10,w=30,h=30 overlaps Lobby
    expect((screen.getByRole("button", { name: /add zone/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  // AZM26: zone positioned between existing zones (no overlap) → no error
  it("AZM26: valid zone in gap between existing zones shows no error", () => {
    render(<AddZoneModal {...defaultProps} existingZones={existingZones} />);
    // Place zone at (42,10,6,30) — gap between Lobby right=40 and ServerRoom left=50
    setField("field-x", 42); setField("field-y", 10);
    setField("field-width", 6); setField("field-height", 30);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });

  // AZM27: overlap error shown above toggle (collapsed state) when initialRect overlaps
  it("AZM27: collapsed advanced section still shows overlap warning", () => {
    // initialRect = drawnRect {x:15,y:20,w:40,h:25} → overlaps Lobby (10,10,30,30)
    render(<AddZoneModal {...defaultProps} initialRect={drawnRect} existingZones={existingZones} />);
    // Advanced is collapsed; overlap-warning-collapsed should appear
    expect(screen.getByTestId("overlap-warning-collapsed")).toBeDefined();
    expect(screen.getByTestId("overlap-warning-collapsed").textContent).toMatch(/overlaps "Lobby"/i);
  });

  // AZM28: touching edge (adjacent zone) is NOT an overlap — allowed
  it("AZM28: zone sharing only a boundary edge with existing zone is valid", () => {
    render(<AddZoneModal {...defaultProps} existingZones={existingZones} />);
    // Lobby right edge is x=40. Place new zone at x=40 → just touching, not overlapping
    setField("field-x", 40); setField("field-y", 10);
    setField("field-width", 10); setField("field-height", 30);
    expect(screen.queryByTestId("validation-error")).toBeNull();
  });
});
