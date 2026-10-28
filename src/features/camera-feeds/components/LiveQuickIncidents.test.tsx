/**
 * LiveQuickIncidents — focused tests (QI1–QI12).
 *
 * Strategy: mock useIncidents, useIncidentsRealtime, react-router and
 * relativeTime so tests are pure unit tests with no network/provider deps.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LiveQuickIncidents from "./LiveQuickIncidents";

/* ── Module mocks (hoisted by Vitest before imports) ─────────────────────── */
const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockRefetch = vi.fn();
const mockUseIncidents = vi.fn();

vi.mock("../../incidents/hooks/useIncidents", () => ({
  useIncidents: (...args: unknown[]) => mockUseIncidents(...args),
}));

vi.mock("../../incidents/hooks/useIncidentsRealtime", () => ({
  useIncidentsRealtime: vi.fn(() => ({ connected: false })),
}));

vi.mock("../../../lib/format", () => ({
  relativeTime: vi.fn((iso: string | null | undefined) => (iso ? "5m ago" : "—")),
}));

/* ── Fixture incidents ───────────────────────────────────────────────────── */
const HIGH_INCIDENT = {
  id: "inc-high",
  organization_id: "org-1",
  emergency_id: null,
  status: "open" as const,
  severity: "high" as const,
  title: "Perimeter Alert",
  summary: null,
  lat: null,
  lng: null,
  opened_at: "2026-10-18T10:00:00Z",
  escalated_at: null,
  resolved_at: null,
  closed_at: null,
};

const CRITICAL_INCIDENT = {
  ...HIGH_INCIDENT,
  id: "inc-critical",
  severity: "critical" as const,
  title: "Critical Threat Detected",
  opened_at: "2026-10-18T10:01:00Z",
};

const MEDIUM_INCIDENT = {
  ...HIGH_INCIDENT,
  id: "inc-medium",
  severity: "medium" as const,
  title: "Loitering Detected",
};

const LOW_INCIDENT = {
  ...HIGH_INCIDENT,
  id: "inc-low",
  severity: "low" as const,
  title: "Low Risk Event",
};

/* ── Helper ──────────────────────────────────────────────────────────────── */
type SetupState = {
  isLoading?: boolean;
  isError?: boolean;
  incidents?: typeof HIGH_INCIDENT[];
};

function setup(state: SetupState = {}) {
  mockUseIncidents.mockReturnValue({
    data:
      state.incidents !== undefined
        ? { data: state.incidents, meta: { total: state.incidents.length, current_page: 1, last_page: 1, per_page: 4 } }
        : undefined,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    refetch: mockRefetch,
  });
  return render(<LiveQuickIncidents />);
}

/* ── Tests ───────────────────────────────────────────────────────────────── */
describe("LiveQuickIncidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
  });

  it("QI1: shows loading indicator when isLoading=true", () => {
    setup({ isLoading: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("QI2: does not render any incident rows while loading", () => {
    setup({ isLoading: true });
    expect(document.querySelectorAll(".lm-incident-item").length).toBe(0);
  });

  it("QI3: shows error alert when isError=true", () => {
    setup({ isError: true });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load incidents/i)).toBeInTheDocument();
  });

  it("QI4: Retry button is present in error state and calls refetch on click", () => {
    setup({ isError: true });
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it("QI5: error state never shows fabricated incident data", () => {
    setup({ isError: true });
    // Legacy mock strings that must never appear
    expect(screen.queryByText("Perimeter Breach")).toBeNull();
    expect(screen.queryByText("Loitering Detected")).toBeNull();
    expect(screen.queryByText("Unauthorized Access")).toBeNull();
    expect(screen.queryByText("Vehicle Without Auth")).toBeNull();
    expect(document.querySelectorAll(".lm-incident-item").length).toBe(0);
  });

  it("QI6: shows 'No open incidents' when API returns an empty list", () => {
    setup({ incidents: [] });
    expect(screen.getByText("No open incidents")).toBeInTheDocument();
    expect(document.querySelectorAll(".lm-incident-item").length).toBe(0);
  });

  it("QI7: renders real incident title from API data", () => {
    setup({ incidents: [HIGH_INCIDENT] });
    expect(screen.getByText("Perimeter Alert")).toBeInTheDocument();
  });

  it("QI8: uses relativeTime for opened_at timestamp", () => {
    setup({ incidents: [HIGH_INCIDENT] });
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("QI9: location column always shows em-dash (no text location field)", () => {
    setup({ incidents: [HIGH_INCIDENT] });
    // The location sub-row must be "—"; relativeTime returns "5m ago" for non-null,
    // so any "—" visible here is the hardcoded location placeholder.
    const subEl = document.querySelector(".lm-incident-sub");
    expect(subEl?.textContent).toBe("—");
  });

  it("QI10: high severity gets lm-incident-icon--red and lm-severity--high classes", () => {
    setup({ incidents: [HIGH_INCIDENT] });
    expect(document.querySelector(".lm-incident-icon--red")).not.toBeNull();
    expect(document.querySelector(".lm-severity--high")).not.toBeNull();
  });

  it("QI11: critical severity gets lm-incident-icon--violet and lm-severity--critical classes", () => {
    setup({ incidents: [CRITICAL_INCIDENT] });
    expect(document.querySelector(".lm-incident-icon--violet")).not.toBeNull();
    expect(document.querySelector(".lm-severity--critical")).not.toBeNull();
  });

  it("QI12: severity label is capitalized from real severity field", () => {
    setup({ incidents: [MEDIUM_INCIDENT, LOW_INCIDENT] });
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("QI13: 'View all' button navigates to /incidents", () => {
    setup({ incidents: [HIGH_INCIDENT] });
    fireEvent.click(screen.getByRole("button", { name: /view all incidents/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/incidents");
  });

  it("QI14: calls useIncidents with status=open and per_page=4", () => {
    setup({ incidents: [] });
    expect(mockUseIncidents).toHaveBeenCalledWith(
      expect.objectContaining({ status: "open", per_page: 4 }),
    );
  });

  it("QI15: medium severity gets amber icon tone", () => {
    setup({ incidents: [MEDIUM_INCIDENT] });
    expect(document.querySelector(".lm-incident-icon--amber")).not.toBeNull();
  });

  it("QI16: low severity gets blue icon tone", () => {
    setup({ incidents: [LOW_INCIDENT] });
    expect(document.querySelector(".lm-incident-icon--blue")).not.toBeNull();
  });
});
