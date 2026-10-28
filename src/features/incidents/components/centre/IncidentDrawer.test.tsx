/**
 * IncidentDrawer — focused tests (ID series).
 *
 * Covers:
 *  ID1  "View full details" link renders with /incidents/:id href when incident is loaded.
 *  ID2  "View full details" link calls onClose when clicked.
 *  ID3  Drawer renders incident title and status when data is available.
 *  ID4  Drawer shows loading state when query is in flight.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ── Module mocks ──────────────────────────────────────────────────────── */
vi.mock("react-router", async (importActual) => {
  const actual = await importActual<typeof import("react-router")>();
  return {
    ...actual,
    Link: ({ children, to, onClick, className }: { children: React.ReactNode; to: string; onClick?: () => void; className?: string }) => (
      <a href={to} onClick={onClick} className={className}>{children}</a>
    ),
  };
});

const mockUseIncident = vi.fn();
vi.mock("../../hooks/useIncident", () => ({
  useIncident: (...args: unknown[]) => mockUseIncident(...args),
}));

const mockUseIncidentActions = vi.fn();
vi.mock("../../hooks/useIncidentActions", () => ({
  useIncidentActions: (...args: unknown[]) => mockUseIncidentActions(...args),
}));

vi.mock("../../../../context/OrganizationContext", () => ({
  useOrganization: () => ({ activeId: "org-1" }),
}));

const mockUseAuthenticatedImage = vi.fn();
vi.mock("../../../../hooks/useAuthenticatedImage", () => ({
  useAuthenticatedImage: (...args: unknown[]) => mockUseAuthenticatedImage(...args),
}));

vi.mock("../../../../components/shared/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("../../../../config/env", () => ({
  env: { apiBaseUrl: "http://localhost" },
}));

vi.mock("../../../../components/shared/Can", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../../../components/shared/ConfirmDialog", () => ({
  default: () => null,
}));

/* ── Helpers ───────────────────────────────────────────────────────────── */
import IncidentDrawer from "./IncidentDrawer";

const NOO_ACTIONS = {
  investigate: { mutateAsync: vi.fn() },
  escalate: { mutateAsync: vi.fn() },
  resolve: { mutateAsync: vi.fn() },
  close: { mutateAsync: vi.fn() },
  notifyAuthorities: { mutateAsync: vi.fn() },
};

function makeDetail(overrides = {}) {
  return {
    incident: {
      id: "inc-00000001-0000-0000-0000-000000000001",
      organization_id: "org-1",
      emergency_id: null,
      opened_by: null,
      assigned_to: null,
      assignee_name: null,
      status: "open" as const,
      severity: "high" as const,
      title: "Unauthorised Access — North Gate",
      summary: null,
      risk_score: 72,
      opened_at: "2024-01-01T10:00:00Z",
      escalated_at: null,
      resolved_at: null,
      closed_at: null,
      authorities_notified_at: null,
      authorities_notified_by: null,
      authorities_notes: null,
      metadata: null,
      created_at: "2024-01-01T10:00:00Z",
    },
    assignment: null,
    timeline: [],
    explanation: {
      detection_event_id: "det-1",
      received_at: "2024-01-01T10:00:00Z",
      camera: { id: "cam-1", label: "CAM-01", site: "North Campus", zone: "Gate A" },
      observed: null,
      analysis: null,
      assessment: null,
    },
    ...overrides,
  };
}

function setup({
  incidentId = "inc-00000001-0000-0000-0000-000000000001",
  onClose = vi.fn(),
  queryState = {},
} = {}) {
  const detail = makeDetail();
  mockUseIncident.mockReturnValue({
    data: { data: detail },
    isLoading: false,
    isError: false,
    ...queryState,
  });
  mockUseIncidentActions.mockReturnValue(NOO_ACTIONS);
  mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "error" });

  render(<IncidentDrawer incidentId={incidentId} onClose={onClose} />);
  return { onClose };
}

/* ── Tests ────────────────────────────────────────────────────────────── */
describe("IncidentDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ID1 — 'View full details' link renders with correct /incidents/:id href", () => {
    setup();
    const link = screen.getByRole("link", { name: /view full details/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/incidents/inc-00000001-0000-0000-0000-000000000001",
    );
  });

  it("ID2 — clicking 'View full details' link calls onClose", async () => {
    const { onClose } = setup();
    const link = screen.getByRole("link", { name: /view full details/i });
    await userEvent.click(link);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ID3 — drawer renders the incident title when data is loaded", () => {
    setup();
    expect(screen.getByText("Unauthorised Access — North Gate")).toBeInTheDocument();
  });

  it("ID4 — drawer shows loading message when query is in flight", () => {
    mockUseIncident.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    mockUseIncidentActions.mockReturnValue(NOO_ACTIONS);
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "loading" });

    render(
      <IncidentDrawer
        incidentId="inc-00000001-0000-0000-0000-000000000001"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/loading incident/i)).toBeInTheDocument();
  });
});
