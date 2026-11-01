/**
 * DetectionsPage — focused smoke tests (DP series).
 *
 * Covers:
 *  DP1  Loading state is shown while the query is in flight.
 *  DP2  Error state with retry button is shown on fetch failure.
 *  DP3  Empty state is shown when the org has no detections.
 *  DP4  A detection row is rendered with type, risk score, and severity badge.
 *  DP5  "View incident" link is rendered for triggered detections that have an incident_id.
 *  DP6  No "View incident" link is rendered when incident_id is null.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ── Module mocks ──────────────────────────────────────────────────────── */
vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../components/common/PageBreadCrumb", () => ({ default: () => null }));

// Stub Link so we don't need a full router context.
vi.mock("react-router", async (importActual) => {
  const actual = await importActual<typeof import("react-router")>();
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const mockUseRecentDetections = vi.fn();
vi.mock("../hooks/useDetections", () => ({
  useRecentDetections: (...args: unknown[]) => mockUseRecentDetections(...args),
}));

/* ── Helpers ───────────────────────────────────────────────────────────── */
import DetectionsPage from "./DetectionsPage";
import type { DetectionEvent } from "../api/detections.types";

function makeDetection(overrides: Partial<DetectionEvent> = {}): DetectionEvent {
  return {
    id: "det-1",
    organization_id: "org-1",
    source: "vision",
    product: null,
    camera_source_id: null,
    type: "loitering",
    severity: "medium",
    risk_score: 55,
    triggered: false,
    incident_id: null,
    site: "North Gate",
    zone: "Entrance",
    lat: null,
    lng: null,
    summary: null,
    received_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function setup(queryState: object) {
  mockUseRecentDetections.mockReturnValue(queryState);
  render(<DetectionsPage />);
}

/* ── Tests ──────────────────────────────────────────────────────────────── */
describe("DetectionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DP1 — shows loading state while query is in flight", () => {
    setup({ data: undefined, isLoading: true, error: null, refetch: vi.fn() });
    expect(screen.getByText(/loading recent detections/i)).toBeInTheDocument();
  });

  it("DP2 — shows error state on fetch failure and triggers refetch on retry", async () => {
    const refetch = vi.fn();
    setup({ data: undefined, isLoading: false, error: new Error("Network error"), refetch });
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("DP3 — shows empty state when there are no detections", () => {
    setup({ data: { data: [] }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/no recent detections/i)).toBeInTheDocument();
  });

  it("DP4 — renders a detection row with type, risk score, and severity badge", () => {
    const det = makeDetection({ type: "loitering", risk_score: 55, severity: "medium" });
    setup({ data: { data: [det] }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/loitering/i)).toBeInTheDocument();
    expect(screen.getByText(/55/)).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it("DP5 — renders 'View incident' link when incident_id is set", () => {
    const det = makeDetection({ triggered: true, incident_id: "inc-abc123" });
    setup({ data: { data: [det] }, isLoading: false, error: null, refetch: vi.fn() });
    const link = screen.getByRole("link", { name: /view incident/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/incidents/inc-abc123");
  });

  it("DP6 — no incident link when incident_id is null", () => {
    const det = makeDetection({ triggered: false, incident_id: null });
    setup({ data: { data: [det] }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.queryByRole("link", { name: /view incident/i })).not.toBeInTheDocument();
  });
});
