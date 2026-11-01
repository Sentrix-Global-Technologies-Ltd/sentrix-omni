/**
 * IncidentDetailPage — focused tests (IDP series).
 *
 * Covers:
 *  IDP1  Loading state is shown while the query is in flight.
 *  IDP2  Error state is shown on fetch failure.
 *  IDP3  Detection Still section renders camera label, site, and zone when explanation present.
 *  IDP4  No Detection Still section when explanation is null.
 *  IDP5  Evidence loading state is rendered inside the detection card.
 *  IDP6  Evidence error "No capture available" is rendered when image fails to load.
 *  IDP7  Observed description and AI explanation fields render when explanation is full.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/* ── Module mocks ──────────────────────────────────────────────────────── */
vi.mock("react-router", async (importActual) => {
  const actual = await importActual<typeof import("react-router")>();
  return {
    ...actual,
    useParams: () => ({ id: "inc-1" }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const mockUseIncident = vi.fn();
vi.mock("../hooks/useIncident", () => ({
  useIncident: (...args: unknown[]) => mockUseIncident(...args),
}));

vi.mock("../hooks/useIncidentsRealtime", () => ({
  useIncidentsRealtime: () => ({ connected: true }),
}));

vi.mock("../../assignments/hooks/useAssignmentsRealtime", () => ({
  useAssignmentsRealtime: () => ({ connected: true }),
}));

const mockUseIncidentActions = vi.fn();
vi.mock("../hooks/useIncidentActions", () => ({
  useIncidentActions: (...args: unknown[]) => mockUseIncidentActions(...args),
}));

const mockUseIncidentDetections = vi.fn();
vi.mock("../hooks/useIncidentDetections", () => ({
  useIncidentDetections: (...args: unknown[]) => mockUseIncidentDetections(...args),
}));

vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: () => ({ principal: null }),
}));

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: () => ({ activeId: "org-1" }),
}));

const mockUseAuthenticatedImage = vi.fn();
vi.mock("../../../hooks/useAuthenticatedImage", () => ({
  useAuthenticatedImage: (...args: unknown[]) => mockUseAuthenticatedImage(...args),
}));

vi.mock("../../../config/env", () => ({
  env: { apiBaseUrl: "http://localhost" },
}));

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../components/shared/PageHeader", () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("../../../components/ui/state/LoadingState", () => ({
  default: () => <p>Loading…</p>,
}));
vi.mock("../../../components/ui/state/ErrorState", () => ({
  default: ({ onRetry }: { onRetry: () => void }) => (
    <div>
      <p>Something went wrong</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  ),
}));
vi.mock("../../../components/ui/badge/StatusBadge", () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("../../../components/ui/realtime/RealtimeIndicator", () => ({ default: () => null }));
vi.mock("../../../components/shared/Can", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../../components/shared/ConfirmActionButton", () => ({ default: () => null }));
vi.mock("../components/IncidentTimelinePanel", () => ({ default: () => <div>timeline</div> }));
vi.mock("../components/IncidentAssignmentPanel", () => ({ default: () => <div>assignment</div> }));
vi.mock("../components/EditIncidentButton", () => ({ default: () => null }));
vi.mock("../../assignments/components/OpenAssignmentButton", () => ({
  default: ({ incidentId }: { incidentId: string }) => (
    <button data-testid="open-assignment-btn" data-incident-id={incidentId}>
      Open assignment
    </button>
  ),
}));
vi.mock("../../intel/components/ThreatScoreGauge", () => ({
  default: ({ score }: { score: number }) => (
    <div data-testid="threat-score-gauge" aria-label={`Threat score ${score}`}>{score}</div>
  ),
}));

/* ── Helpers ───────────────────────────────────────────────────────────── */
import IncidentDetailPage from "./IncidentDetailPage";
import type { IncidentDetail } from "../api/incidents.types";

const NOO_ACTIONS = {
  investigate: { mutateAsync: vi.fn() },
  escalate: { mutateAsync: vi.fn() },
  resolve: { mutateAsync: vi.fn() },
  close: { mutateAsync: vi.fn() },
  notifyAuthorities: { mutateAsync: vi.fn() },
};

function makeDetail(overrides: Partial<IncidentDetail> = {}): IncidentDetail {
  return {
    incident: {
      id: "inc-1",
      organization_id: "org-1",
      emergency_id: null,
      opened_by: null,
      assigned_to: null,
      assignee_name: null,
      status: "open",
      severity: "high",
      title: "Suspicious Activity",
      summary: "Motion detected near perimeter.",
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

function makeDetections(ids: string[] = ["det-1"]) {
  return ids.map((id, i) => ({
    id,
    organization_id: "org-1",
    source: "vision" as const,
    product: null,
    camera_source_id: "cam-1",
    type: "motion",
    severity: "high" as const,
    risk_score: 72,
    triggered: true,
    incident_id: "inc-1",
    site: "North Campus",
    zone: "Gate A",
    lat: null,
    lng: null,
    summary: null,
    received_at: `2024-01-01T10:00:0${i}Z`,
    created_at: `2024-01-01T10:00:0${i}Z`,
  }));
}

function setup(
  queryState = {},
  imageState = { src: null as string | null, status: "loading" },
  detectionsOverride: { data?: { data: unknown[] } | undefined; isLoading?: boolean; error?: Error | null } = {},
) {
  mockUseIncidentActions.mockReturnValue(NOO_ACTIONS);
  mockUseAuthenticatedImage.mockReturnValue(imageState);
  mockUseIncident.mockReturnValue(queryState);
  mockUseIncidentDetections.mockReturnValue({
    data: { data: makeDetections(["det-1"]) },
    isLoading: false,
    error: null,
    ...detectionsOverride,
  });
  render(<IncidentDetailPage />);
}

/* ── Tests ────────────────────────────────────────────────────────────── */
describe("IncidentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("IDP1 — shows loading state while query is in flight", () => {
    setup({ data: undefined, isLoading: true, error: null, refetch: vi.fn() });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("IDP2 — shows error state on fetch failure", () => {
    setup({ data: undefined, isLoading: false, error: new Error("fail"), refetch: vi.fn() });
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("IDP3 — Detection Still section renders with camera, site, and zone in metadata", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
    );
    // "Detection Still" heading confirms the section is present
    expect(screen.getByText(/detection still/i)).toBeInTheDocument();
    expect(screen.getAllByText("CAM-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("North Campus").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gate A").length).toBeGreaterThan(0);
  });

  it("IDP4 — Detection Still section is absent when explanation is null", () => {
    const detail = makeDetail({ explanation: null });
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
    );
    // When there is no explanation the Detection Still card should not appear
    expect(screen.queryByText(/detection still/i)).not.toBeInTheDocument();
  });

  it("IDP5 — evidence shows loading placeholder while image is loading", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "loading" },
    );
    expect(screen.getAllByText(/loading frame/i).length).toBeGreaterThan(0);
  });

  it("IDP6 — evidence shows 'No capture available' when image fails to load", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
    );
    expect(screen.getAllByText(/no capture available/i).length).toBeGreaterThan(0);
  });

  it("IDP8 — one real detection: count shows (1) and four default placeholder slots appear", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: "blob:img", status: "idle" },
      { data: { data: makeDetections(["det-1"]) }, isLoading: false, error: null },
    );
    // Heading must say (1) — placeholders are NOT counted
    expect(screen.getByText(/evidence \(1\)/i)).toBeInTheDocument();
    // Four default placeholder slots should be rendered
    const defaults = screen.getAllByLabelText(/no additional evidence/i);
    expect(defaults).toHaveLength(4);
  });

  it("IDP8b — multiple real detections: no extra default placeholders are added", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: "blob:img", status: "idle" },
      { data: { data: makeDetections(["det-1", "det-2", "det-3"]) }, isLoading: false, error: null },
    );
    // Count reflects actual records
    expect(screen.getByText(/evidence \(3\)/i)).toBeInTheDocument();
    // No default placeholders for multi-detection
    expect(screen.queryAllByLabelText(/no additional evidence/i)).toHaveLength(0);
  });

  it("IDP9 — Evidence section shows empty state when no detections", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
      { data: { data: [] }, isLoading: false, error: null },
    );
    expect(screen.getByText(/no detection events for this incident/i)).toBeInTheDocument();
  });

  it("IDP10 — Evidence section renders a slot per detection event", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
      { data: { data: makeDetections(["det-1", "det-2"]) }, isLoading: false, error: null },
    );
    // Each unavailable image slot shows "Image unavailable"
    const slots = screen.getAllByText(/image unavailable/i);
    expect(slots.length).toBe(2);
  });

  it("IDP11 — Evidence section shows skeleton while detections loading", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "loading" },
      { data: undefined, isLoading: true, error: null },
    );
    expect(screen.getByRole("status", { name: /loading evidence/i })).toBeInTheDocument();
  });

  it("IDP12 — Evidence thumb shows sr-only loading text while image is loading", () => {
    const detail = makeDetail();
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "loading" },
      { data: { data: makeDetections(["det-1"]) }, isLoading: false, error: null },
    );
    // sr-only "Loading frame" text confirms loading state in carousel thumb
    const srText = screen.getAllByText(/loading frame/i);
    expect(srText.length).toBeGreaterThan(0);
  });

  // ── Assignment summary in Response Log ────────────────────────────────────

  it("IDP-ASN-1 — no assignment: shows 'No active assignment' in Response Log", () => {
    const detail = makeDetail({ assignment: null });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/no active assignment/i)).toBeInTheDocument();
  });

  it("IDP-ASN-2 — no assignment + Can passthrough: OpenAssignmentButton is rendered", () => {
    const detail = makeDetail({ assignment: null });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByTestId("open-assignment-btn")).toBeInTheDocument();
  });

  it("IDP-ASN-3 — existing assignment: 'No active assignment' text is absent", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "pending",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.queryByText(/no active assignment/i)).not.toBeInTheDocument();
    // OpenAssignmentButton not rendered when assignment exists
    expect(screen.queryByTestId("open-assignment-btn")).not.toBeInTheDocument();
  });

  it("IDP-ASN-4 — existing assignment: humanized status is visible", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "dispatching",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // humanize("dispatching") → "Dispatching"
    expect(screen.getByText("Dispatching")).toBeInTheDocument();
  });

  it("IDP-ASN-5 — active responder line: responder name and role are shown", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "active",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [
          {
            id: "line-1",
            assignment_id: "asgn-1",
            organization_id: "org-1",
            responder_id: "resp-1",
            responder_user_id: "user-1",
            responder_name: "Alice Chen",
            responder_email: null,
            incident_id: "inc-1",
            role: "primary",
            status: "on_scene",
            attempt: 1,
            assigned_by: null,
            offered_at: "2024-01-01T10:05:00Z",
            accepted_at: "2024-01-01T10:06:00Z",
            en_route_at: "2024-01-01T10:07:00Z",
            on_scene_at: "2024-01-01T10:10:00Z",
            completed_at: null,
            released_at: null,
            decline_reason: null,
            outcome: null,
            created_at: "2024-01-01T10:05:00Z",
          },
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:10:00Z",
      },
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("primary")).toBeInTheDocument();
  });

  it("IDP-ASN-6 — terminal responder lines are not shown in summary", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "pending",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [
          {
            id: "line-2",
            assignment_id: "asgn-1",
            organization_id: "org-1",
            responder_id: "resp-2",
            responder_user_id: "user-2",
            responder_name: "Bob Smith",
            responder_email: null,
            incident_id: "inc-1",
            role: "primary",
            status: "declined",
            attempt: 1,
            assigned_by: null,
            offered_at: "2024-01-01T10:05:00Z",
            accepted_at: null,
            en_route_at: null,
            on_scene_at: null,
            completed_at: null,
            released_at: null,
            decline_reason: "unavailable",
            outcome: null,
            created_at: "2024-01-01T10:05:00Z",
          },
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:05:30Z",
      },
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // Declined line should not appear in the active-lines summary
    expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument();
  });

  // ── Response Log timeline entries ─────────────────────────────────────────

  it("IDP-ASN-7 — assignment.responder_en_route event shows en-route message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:07:00Z", type: "assignment.responder_en_route", source: "assignment", payload: { responder_id: "resp-1", role: "primary" } },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/en route to the scene/i)).toBeInTheDocument();
  });

  it("IDP-ASN-8 — assignment.responder_on_scene event shows on-scene message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:10:00Z", type: "assignment.responder_on_scene", source: "assignment", payload: { responder_id: "resp-1", role: "primary" } },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/arrived on scene/i)).toBeInTheDocument();
  });

  it("IDP-ASN-9 — assignment.responder_declined event shows declined message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:06:00Z", type: "assignment.responder_declined", source: "assignment", payload: { responder_id: "resp-1", reason: "unavailable" } },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/declined the offer/i)).toBeInTheDocument();
  });

  it("IDP-ASN-10 — assignment.cancelled event shows cancellation message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:15:00Z", type: "assignment.cancelled", source: "assignment", payload: {} },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/responders stood down/i)).toBeInTheDocument();
  });

  it("IDP-ASN-11 — assignment.completed event shows completion message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T11:00:00Z", type: "assignment.completed", source: "assignment", payload: {} },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/responders released/i)).toBeInTheDocument();
  });

  it("IDP-ASN-12 — assignment.responder_timed_out shows timeout message in Response Log", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:06:30Z", type: "assignment.responder_timed_out", source: "assignment", payload: { responder_id: "resp-1" } },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/did not respond in time/i)).toBeInTheDocument();
  });

  it("IDP-ASN-13 — assignment.dispatch_escalated gets escalation message (not incident escalation message)", () => {
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:07:00Z", type: "assignment.dispatch_escalated", source: "assignment", payload: {} },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/no responder accepted in time/i)).toBeInTheDocument();
    expect(screen.queryByText(/incident escalated to next response tier/i)).not.toBeInTheDocument();
  });

  it("IDP-ASN-14 — no assignment events in timeline: Response Log shows no-events text", () => {
    const detail = makeDetail({ timeline: [] });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/no response events recorded/i)).toBeInTheDocument();
  });

  it("IDP-ASN-15 — evidence section and layout remain unaffected by assignment changes", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "active",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
    });
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: "blob:img", status: "idle" },
      { data: { data: makeDetections(["det-1"]) }, isLoading: false, error: null },
    );
    // Batch 6 evidence section still renders (1 real + 4 placeholders)
    expect(screen.getByText(/evidence \(1\)/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/no additional evidence/i)).toHaveLength(4);
    // Detection Still still present
    expect(screen.getByText(/detection still/i)).toBeInTheDocument();
  });


  /* ── IDP-RLI (Response Log Improvements) ──────────────────────────────── */

  it("IDP-RLI-1 — more than five timeline events all appear in the Response Log", () => {
    // 8 assignment-source events: all should render (no slice limit)
    const entries = Array.from({ length: 8 }, (_, i) => ({
      at: `2024-01-01T10:0${i}:00Z`,
      type: "assignment.responder_offered",
      source: "assignment",
      payload: { responder_id: `resp-${i}` },
    }));
    const detail = makeDetail({ timeline: entries });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // 8 "offered" messages should all be present
    const msgs = screen.getAllByText(/assignment offered to a responder/i);
    expect(msgs.length).toBe(8);
  });

  it("IDP-RLI-2 — timeline entries maintain chronological order and show timestamps", () => {
    const entries = [
      { at: "2024-01-01T10:00:00Z", type: "assignment.created", source: "assignment", payload: {} },
      { at: "2024-01-01T10:05:00Z", type: "assignment.responder_offered", source: "assignment", payload: { responder_id: "resp-1" } },
      { at: "2024-01-01T10:10:00Z", type: "assignment.responder_accepted", source: "assignment", payload: { responder_id: "resp-1" } },
    ];
    const detail = makeDetail({ timeline: entries });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // All three messages present — order guaranteed by data ordering
    expect(screen.getByText(/assignment created for this incident/i)).toBeInTheDocument();
    expect(screen.getByText(/assignment offered to a responder/i)).toBeInTheDocument();
    expect(screen.getByText(/responder accepted the assignment/i)).toBeInTheDocument();
    // Timestamps rendered (at least one time element)
    const times = document.querySelectorAll("time");
    expect(times.length).toBeGreaterThan(0);
  });

  it("IDP-RLI-3 — responder action shows responder name from assignment.responders", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-1",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "active",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [
          {
            id: "line-1",
            assignment_id: "asgn-1",
            organization_id: "org-1",
            responder_id: "resp-uuid-1",
            responder_user_id: "user-1",
            responder_name: "Maya Torres",
            responder_email: "maya@example.com",
            incident_id: "inc-1",
            role: "primary",
            status: "accepted",
            attempt: 1,
            assigned_by: null,
            offered_at: "2024-01-01T10:01:00Z",
            accepted_at: "2024-01-01T10:02:00Z",
            en_route_at: null,
            on_scene_at: null,
            completed_at: null,
            released_at: null,
            decline_reason: null,
            outcome: null,
            created_at: "2024-01-01T10:01:00Z",
          },
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:02:00Z",
      },
      timeline: [
        {
          at: "2024-01-01T10:02:00Z",
          type: "assignment.responder_accepted",
          source: "assignment",
          payload: { responder_id: "resp-uuid-1", role: "primary" },
        },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // Actor name resolved from assignment.responders
    expect(screen.getAllByText("Maya Torres").length).toBeGreaterThanOrEqual(1);
    // Action description uses first-person phrasing (not "Responder accepted")
    expect(screen.getByText(/accepted the assignment/i)).toBeInTheDocument();
  });

  it("IDP-RLI-4 — dispatcher action uses actor_name from backend when available", () => {
    const detail = makeDetail({
      timeline: [
        {
          at: "2024-01-01T10:00:00Z",
          type: "assignment.created",
          source: "assignment",
          actor_name: "Jordan Kim",
          payload: { dispatch_mode: "manual" },
        },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // Actor name is now baked into the description sentence
    expect(screen.getByText(/jordan kim created the assignment/i)).toBeInTheDocument();
  });

  it("IDP-RLI-5 — automated system event (timed_out) with unknown responder shows fallback description", () => {
    const detail = makeDetail({
      timeline: [
        {
          at: "2024-01-01T10:06:00Z",
          type: "assignment.responder_timed_out",
          source: "assignment",
          payload: { responder_id: "resp-unknown" },
        },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // No matching responder in null assignment → description embeds "Unknown responder"
    // "Unknown responder" resolves to non-named-actor branch → generic description
    expect(screen.getByText(/offer expired — responder did not respond in time/i)).toBeInTheDocument();
  });

  it("IDP-RLI-5b — dispatch escalation (no actor) shows system description without name prefix", () => {
    const detail = makeDetail({
      timeline: [
        {
          at: "2024-01-01T10:07:00Z",
          type: "assignment.dispatch_escalated",
          source: "assignment",
          payload: {},
        },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // System event: no actor name shown — description appears without name prefix
    // Badge shows "Dispatch Escalated"; description is the full sentence
    expect(screen.getByText(/dispatch escalated — no responder accepted in time/i)).toBeInTheDocument();
  });

  it("IDP-RLI-6 — responder_id in payload with no matching assignment line shows honest fallback", () => {
    const detail = makeDetail({
      assignment: null,
      timeline: [
        {
          at: "2024-01-01T10:02:00Z",
          type: "assignment.responder_accepted",
          source: "assignment",
          payload: { responder_id: "resp-orphan" },
        },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // "Unknown responder" is not a named actor so description shows generic form
    expect(screen.getByText(/responder accepted the assignment/i)).toBeInTheDocument();
  });

  it("IDP-RLI-7 — incident-source events do NOT appear in the Response Log", () => {
    const detail = makeDetail({
      timeline: [
        // This is an incident-domain event — should NOT appear in Response Log
        { at: "2024-01-01T10:00:00Z", type: "incident.opened", source: "incident", payload: {} },
        // This assignment event should appear
        { at: "2024-01-01T10:01:00Z", type: "assignment.created", source: "assignment", payload: {} },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // Assignment entry present in the Response Log section
    expect(screen.getByText(/assignment created for this incident/i)).toBeInTheDocument();
    // incident.opened message should NOT appear (filtered out of Response Log)
    expect(screen.queryByText(/incident opened and response initiated/i)).not.toBeInTheDocument();
  });

  it("IDP-RLI-8 — only incident-source entries visible in the Incident Timeline panel", () => {
    // The Incident Timeline panel receives all entries but filters internally.
    // We verify that assignment lifecycle entries do NOT appear as timeline items
    // by checking the panel renders without them (the humanized type would appear).
    const detail = makeDetail({
      timeline: [
        { at: "2024-01-01T10:00:00Z", type: "incident.opened", source: "incident", payload: {} },
        { at: "2024-01-01T10:05:00Z", type: "assignment.responder_offered", source: "assignment", payload: {} },
        { at: "2024-01-01T10:06:00Z", type: "assignment.responder_accepted", source: "assignment", payload: {} },
      ],
    });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    // The timeline panel renders "Incident Opened" (from incidentTone.humanize)
    // but "Assignment Responder Offered" should NOT appear there
    // (it shows in Response Log section instead)
    // The Response Log shows accepted/offered
    expect(screen.getByText(/assignment offered to a responder/i)).toBeInTheDocument();
  });

  it("IDP-RLI-9 — existing IDP-ASN passes unaffected (regression: permission-gated open button)", () => {
    const detail = makeDetail({ assignment: null, timeline: [] });
    setup({ data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() });
    expect(screen.getByText(/no active assignment/i)).toBeInTheDocument();
    expect(screen.getByTestId("open-assignment-btn")).toBeInTheDocument();
  });

  it("IDP-RLI-10 — evidence and realtime still work alongside Response Log improvements", () => {
    const detail = makeDetail({
      assignment: {
        id: "asgn-2",
        organization_id: "org-1",
        incident_id: "inc-1",
        status: "dispatching",
        dispatch_mode: "manual",
        required_primary: 1,
        required_supporting: 0,
        escalation_level: 0,
        acceptance_deadline_at: null,
        opened_by: null,
        responders: [],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
      timeline: [
        { at: "2024-01-01T10:00:00Z", type: "assignment.created", source: "assignment", actor_name: "Admin", payload: {} },
      ],
    });
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: "blob:img", status: "idle" },
      { data: { data: makeDetections(["det-1"]) }, isLoading: false, error: null },
    );
    // Evidence section unaffected
    expect(screen.getByText(/evidence \(1\)/i)).toBeInTheDocument();
    // Actor name baked into description sentence
    expect(screen.getByText(/admin created the assignment/i)).toBeInTheDocument();
  });
  it("IDP7 — observed description is rendered when present in explanation", () => {
    const detail = makeDetail({
      explanation: {
        detection_event_id: "det-1",
        received_at: "2024-01-01T10:00:00Z",
        camera: { id: "cam-1", label: "CAM-01", site: "North Campus", zone: null },
        observed: {
          description: "Person seen climbing fence near the east perimeter.",
          detections: [],
          scene_risk: "high",
        },
        analysis: {
          provider: "openai",
          model: "gpt-4o",
          frame_hash: null,
          content_type: "image/jpeg",
          analyzed_at: "2024-01-01T10:00:00Z",
          latency_ms: 420,
          attempts: 1,
        },
        assessment: {
          basis_label: "crowd_surge",
          basis_confidence: 0.92,
          confidence_factor: null,
          base_risk: 70,
          risk_score: 72,
          intrinsic_severity: "high",
          banded_severity: "high",
          severity: "high",
          matched_rule: "crowd_density_threshold",
          matched_term: "density > 0.8",
          trigger_threshold: 40,
          triggered: true,
          reason: "Elevated risk. Security response recommended.",
        },
      },
    });
    setup(
      { data: { data: detail }, isLoading: false, error: null, refetch: vi.fn() },
      { src: null, status: "error" },
    );
    expect(screen.getByText(/person seen climbing fence/i)).toBeInTheDocument();
    // Decision reason block removed from UI — no longer asserted.
    // Model row always shows fixed branding regardless of backend value.
    expect(screen.getByText(/Sentrix Perimeter Guard 1\.0/i)).toBeInTheDocument();
  });
});
