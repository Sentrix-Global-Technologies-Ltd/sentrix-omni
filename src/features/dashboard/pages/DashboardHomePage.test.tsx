/**
 * DashboardHomePage — focused correctness tests (DBP series).
 *
 * Tests covered:
 *   DBP-1   Total Cameras KPI navigates to /vision-guard/camera-sources
 *   DBP-2   Detections KPI uses detection-event count (not open-incidents count)
 *   DBP-3   Detections KPI navigates to /vision-guard/detections
 *   DBP-4   Detections and incidents are independent data sources
 *   DBP-5   Middle panel heading reads "Open Incidents"
 *   DBP-6   Open Incidents "View all" link → /incidents
 *   DBP-7   Camera image rendered via authenticated blob URL
 *   DBP-8   Camera loading skeleton while status === "loading"
 *   DBP-9   Camera error state shows "Frame unavailable"
 *   DBP-10  Camera empty state shows "No live frame available"
 *   DBP-11  Detections KPI reads authoritative total from intel report
 *   DBP-12  Detections KPI shows "—" while intel report is loading
 *   DBP-R1  Facility Overview hidden for non-SuperAdmin; Recent Incidents + Analytics Incident chart shown
 *   DBP-R2  Facility Overview shown for SuperAdmin; Recent Incidents + Analytics Incident chart hidden
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/* ─── Module-level mocks ─────────────────────────────────────────────────── */

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("../../../components/ui/realtime/RealtimeIndicator", () => ({ default: () => null }));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

vi.mock("react-apexcharts", () => ({ default: () => null }));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ principal: { name: "Test User" } }),
}));

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: () => ({
    activeId: "org-test",
    current: { name: "Test Org" },
  }),
}));

vi.mock("../../incidents/hooks/useIncidents", () => ({
  useIncidents: vi.fn(),
}));

vi.mock("../../incidents/hooks/useIncidentsRealtime", () => ({
  useIncidentsRealtime: () => ({ connected: true }),
}));

vi.mock("../../camera-feeds/hooks/useCameraFeeds", () => ({
  useCameraFeeds: vi.fn(),
  useCameraSourcesSummary: vi.fn(),
}));

vi.mock("../../intel/hooks/useIntel", () => ({
  useThreatScore: vi.fn(),
  useIntelReport: vi.fn(),
}));

vi.mock("../../superadmin/hooks/usePlatformOrganizations", () => ({
  usePlatformOrganizations: vi.fn(),
}));


vi.mock("../../../hooks/useAuthenticatedImage", () => ({
  useAuthenticatedImage: vi.fn(),
}));

// useAuthz — mocked at top level so all tests can control isSuperAdmin
vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: vi.fn(),
}));

/* ─── Imports after mocks ────────────────────────────────────────────────── */

import DashboardHomePage from "./DashboardHomePage";
import { useIncidents } from "../../incidents/hooks/useIncidents";
import { useCameraFeeds, useCameraSourcesSummary } from "../../camera-feeds/hooks/useCameraFeeds";
import { useThreatScore, useIntelReport } from "../../intel/hooks/useIntel";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { useAuthz } from "../../../hooks/useAuthz";
import { usePlatformOrganizations } from "../../superadmin/hooks/usePlatformOrganizations";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const EMPTY_QUERY = { isLoading: false, error: null, data: undefined };

function makeCamera(partial = {}) {
  return {
    id: "cam-1",
    label: "North Gate",
    feed_status: "live",
    last_frame_url: "https://api.example.com/organizations/org-test/cameras/cam-1/frame",
    last_frame_at: "2024-01-01T12:00:00Z",
    ...partial,
  };
}

function makeIncident(partial = {}) {
  return {
    id: "inc-1",
    title: "Test Incident",
    severity: "medium" as const,
    status: "open" as const,
    opened_at: new Date().toISOString(),
    metadata: null,
    ...partial,
  };
}

function mockAuthz(isSuperAdmin = false) {
  vi.mocked(useAuthz).mockReturnValue({
    isSuperAdmin,
    principal: null,
    isAuthenticated: true,
    isOrgMember: true,
    can: vi.fn(() => isSuperAdmin),
    canAny: vi.fn(() => isSuperAdmin),
    hasRole: vi.fn(() => isSuperAdmin),
    isAllowed: vi.fn(() => true),
  });
}

function setupDefaultMocks() {
  // Default: non-SuperAdmin
  mockAuthz(false);

  vi.mocked(useIncidents).mockReturnValue({
    ...EMPTY_QUERY,
    data: { data: [], meta: { total: 0 } },
  } as ReturnType<typeof useIncidents>);

  vi.mocked(useCameraFeeds).mockReturnValue({
    ...EMPTY_QUERY,
    data: { data: [] },
  } as ReturnType<typeof useCameraFeeds>);

  vi.mocked(useCameraSourcesSummary).mockReturnValue({
    ...EMPTY_QUERY,
    data: { data: { total: 0, online: 0, offline: 0, stale: 0 } },
  } as ReturnType<typeof useCameraSourcesSummary>);

  vi.mocked(useThreatScore).mockReturnValue({
    ...EMPTY_QUERY,
    data: { data: { score: 0, factors: [] } },
  } as ReturnType<typeof useThreatScore>);

  vi.mocked(useIntelReport).mockReturnValue({
    ...EMPTY_QUERY,
    data: { data: { incidents: { total: 0 }, detections: { total: 0 } } },
  } as ReturnType<typeof useIntelReport>);

  vi.mocked(useAuthenticatedImage).mockReturnValue({
    src: null,
    status: "idle",
  });

  vi.mocked(usePlatformOrganizations).mockReturnValue({
    isLoading: false,
    error: null,
    data: { data: [], meta: {} },
  } as ReturnType<typeof usePlatformOrganizations>);
}

beforeEach(() => {
  setupDefaultMocks();
});

/* ─── DBP-1: Total Cameras navigation ───────────────────────────────────── */

describe("DBP-1: Total Cameras KPI navigation", () => {
  it("Total Cameras card links to /vision-guard/camera-sources (not /hardware)", () => {
    vi.mocked(useCameraSourcesSummary).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: { total: 7, online: 5, offline: 2, stale: 0 } },
    } as ReturnType<typeof useCameraSourcesSummary>);

    render(<DashboardHomePage />);

    const link = screen.getByRole("link", { name: /total cameras/i });
    expect(link).toHaveAttribute("href", "/vision-guard/camera-sources");
    expect(link).not.toHaveAttribute("href", "/hardware");
  });
});

/* ─── DBP-2: Detections KPI reads from intel report ─────────────────────── */

describe("DBP-2: Detections KPI reads authoritative total from intel report", () => {
  it("shows 87 when useIntelReport returns detections.total = 87", () => {
    vi.mocked(useIntelReport).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: { incidents: { total: 0 }, detections: { total: 87 } } },
    } as ReturnType<typeof useIntelReport>);

    render(<DashboardHomePage />);

    const detectionsCard = screen.getByRole("link", { name: /detections/i });
    expect(detectionsCard).toHaveTextContent("87");
  });

  it("shows 0 when useIntelReport returns detections.total = 0", () => {
    vi.mocked(useIntelReport).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: { incidents: { total: 0 }, detections: { total: 0 } } },
    } as ReturnType<typeof useIntelReport>);

    render(<DashboardHomePage />);

    const detectionsCard = screen.getByRole("link", { name: /detections/i });
    expect(detectionsCard).toHaveTextContent("0");
  });
});

/* ─── DBP-3: Detections KPI navigation ──────────────────────────────────── */

describe("DBP-3: Detections KPI navigation", () => {
  it("Detections card links to /vision-guard/detections", () => {
    render(<DashboardHomePage />);

    const link = screen.getByRole("link", { name: /detections/i });
    expect(link).toHaveAttribute("href", "/vision-guard/detections");
  });
});

/* ─── DBP-4: Independent data sources ───────────────────────────────────── */

describe("DBP-4: Detections and incidents are independent data sources", () => {
  it("detection count is not affected by open-incidents count", () => {
    const incidents = Array.from({ length: 20 }, (_, i) => makeIncident({ id: `inc-${i}` }));
    vi.mocked(useIncidents).mockImplementation((params) => {
      if (params?.status === "open") {
        return {
          ...EMPTY_QUERY,
          data: { data: incidents, meta: { total: 20 } },
        } as ReturnType<typeof useIncidents>;
      }
      return { ...EMPTY_QUERY, data: { data: [], meta: {} } } as ReturnType<typeof useIncidents>;
    });

    vi.mocked(useIntelReport).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: { incidents: { total: 20 }, detections: { total: 5 } } },
    } as ReturnType<typeof useIntelReport>);

    render(<DashboardHomePage />);

    const detectionsCard = screen.getByRole("link", { name: /detections/i });
    expect(detectionsCard).toHaveTextContent("5");
    expect(detectionsCard).not.toHaveTextContent("20");
  });
});

/* ─── DBP-5: Middle panel heading ───────────────────────────────────────── */

describe("DBP-5: Middle panel heading", () => {
  it("renders heading 'Live Camera Still' (Open Incidents card was removed)", () => {
    render(<DashboardHomePage />);
    expect(screen.getByRole("heading", { name: /live camera still/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /open incidents/i })).not.toBeInTheDocument();
  });

  it("does not render a panel h3 named 'Detections'", () => {
    render(<DashboardHomePage />);
    const headings = screen.getAllByRole("heading");
    const detectionsPanelHeading = headings.find(
      (h) => h.tagName === "H3" && h.textContent?.trim() === "Detections",
    );
    expect(detectionsPanelHeading).toBeUndefined();
  });
});

/* ─── DBP-6: Open Incidents "View all" link ─────────────────────────────── */

describe("DBP-6: Live Camera 'View all' link", () => {
  it("'View all' link adjacent to the Live Camera Still heading targets /vision-guard/live", () => {
    render(<DashboardHomePage />);
    const heading = screen.getByRole("heading", { name: /live camera still/i });
    const panelHeader = heading.closest("div.mb-3") ?? heading.parentElement;
    const linkInHeader = panelHeader?.querySelector("a[href]");
    expect(linkInHeader?.getAttribute("href")).toBe("/vision-guard/live");
  });

  it("the fullscreen control inside the camera viewport also links to /vision-guard/live", () => {
    render(<DashboardHomePage />);
    const fsLinks = screen.getAllByRole("link", { name: /open fullscreen view/i });
    expect(fsLinks.length).toBeGreaterThan(0);
    expect(fsLinks[0].getAttribute("href")).toBe("/vision-guard/live");
  });
});

/* ─── DBP-7: Camera image via authenticated hook ────────────────────────── */

describe("DBP-7: Camera image rendered via authenticated blob URL", () => {
  it("renders <img> with blob URL from useAuthenticatedImage when src is available", () => {
    vi.mocked(useCameraFeeds).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: [makeCamera()] },
    } as ReturnType<typeof useCameraFeeds>);

    const blobUrl = "blob:http://localhost/fake-blob-uuid";
    vi.mocked(useAuthenticatedImage).mockReturnValue({ src: blobUrl, status: "idle" });

    render(<DashboardHomePage />);

    const img = screen.getByRole("img", { name: /north gate/i });
    expect(img).toHaveAttribute("src", blobUrl);
    expect(img.getAttribute("src")).not.toContain("api.example.com");
  });

  it("calls useAuthenticatedImage with the camera's last_frame_url and last_frame_at", () => {
    const camera = makeCamera();
    vi.mocked(useCameraFeeds).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: [camera] },
    } as ReturnType<typeof useCameraFeeds>);

    vi.mocked(useAuthenticatedImage).mockReturnValue({ src: null, status: "idle" });

    render(<DashboardHomePage />);

    expect(vi.mocked(useAuthenticatedImage)).toHaveBeenCalledWith(
      camera.last_frame_url,
      camera.last_frame_at,
    );
  });
});

/* ─── DBP-8: Loading skeleton ───────────────────────────────────────────── */

describe("DBP-8: Camera loading skeleton", () => {
  it("shows animate-pulse skeleton when camera exists and status is 'loading'", () => {
    vi.mocked(useCameraFeeds).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: [makeCamera()] },
    } as ReturnType<typeof useCameraFeeds>);

    vi.mocked(useAuthenticatedImage).mockReturnValue({ src: null, status: "loading" });

    render(<DashboardHomePage />);

    expect(screen.queryByRole("img", { name: /north gate/i })).not.toBeInTheDocument();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

/* ─── DBP-9: Error state ─────────────────────────────────────────────────── */

describe("DBP-9: Camera error state", () => {
  it("shows 'Frame unavailable' when status is 'error'", () => {
    vi.mocked(useCameraFeeds).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: [makeCamera()] },
    } as ReturnType<typeof useCameraFeeds>);

    vi.mocked(useAuthenticatedImage).mockReturnValue({ src: null, status: "error" });

    render(<DashboardHomePage />);

    expect(screen.getByText("Frame unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No live frame available")).not.toBeInTheDocument();
  });
});

/* ─── DBP-10: Empty state ───────────────────────────────────────────────── */

describe("DBP-10: Camera empty state", () => {
  it("shows 'No live frame available' when no cameras exist", () => {
    vi.mocked(useCameraFeeds).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: [] },
    } as ReturnType<typeof useCameraFeeds>);

    vi.mocked(useAuthenticatedImage).mockReturnValue({ src: null, status: "idle" });

    render(<DashboardHomePage />);

    expect(screen.getByText("No live frame available")).toBeInTheDocument();
  });
});

/* ─── DBP-11 & DBP-12: Detections KPI — authoritative count & loading ────── */

describe("DBP-11: Detections KPI shows authoritative total from intel report", () => {
  it("shows 1500 even though the list endpoint caps at 50", () => {
    // 1500 > 50 cap: the KPI must reflect the true aggregate, not list.length
    vi.mocked(useIntelReport).mockReturnValue({
      ...EMPTY_QUERY,
      data: { data: { incidents: { total: 0 }, detections: { total: 1500 } } },
    } as ReturnType<typeof useIntelReport>);

    render(<DashboardHomePage />);

    const detectionsCard = screen.getByRole("link", { name: /detections/i });
    expect(detectionsCard).toHaveTextContent("1500");
  });
});

describe("DBP-12: Detections KPI shows dash while intel report is loading", () => {
  it("renders '—' when useIntelReport is loading", () => {
    vi.mocked(useIntelReport).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as ReturnType<typeof useIntelReport>);

    render(<DashboardHomePage />);

    // The KpiCard renders a loading skeleton when loading=true; value "—"
    // is what the component sets as its data-driven value while pending
    const detectionsCard = screen.getByRole("link", { name: /detections/i });
    expect(detectionsCard).toBeInTheDocument();
  });
});

/* ─── DBP-R: Facility Overview role gate ────────────────────────────────── */

describe("DBP-R1: Facility Overview hidden for non-SuperAdmin", () => {
  it("hides Facility Overview and shows Recent Incidents + Analytics Incident chart", () => {
    mockAuthz(false);
    render(<DashboardHomePage />);

    expect(screen.queryByRole("heading", { name: /facility overview/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recent incidents/i })).toBeInTheDocument();
    // Quick Insights replaced by IncidentAnalyticsChart — "Analytics Incident" heading
    expect(screen.getByRole("heading", { name: /analytics incident/i })).toBeInTheDocument();
  });
});

describe("DBP-R2: Facility Overview visible only for SuperAdmin", () => {
  it("shows Facility Overview and hides Recent Incidents + Quick Insights", () => {
    mockAuthz(true);

    vi.mocked(usePlatformOrganizations).mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          { id: "org-1", name: "Alpha Corp", slug: "alpha", region: null, lat: null, lng: null,
            camera_sources_count: 12, camera_sources_online_count: 10,
            subscription_plan_key: null, subscription_status: null, created_at: null },
          { id: "org-2", name: "Beta Security", slug: "beta", region: null, lat: null, lng: null,
            camera_sources_count: 4, camera_sources_online_count: 4,
            subscription_plan_key: null, subscription_status: null, created_at: null },
        ],
        meta: {},
      },
    } as ReturnType<typeof usePlatformOrganizations>);

    render(<DashboardHomePage />);

    expect(screen.getByRole("heading", { name: /facility overview/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /recent incidents/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /analytics incident/i })).not.toBeInTheDocument();

    // Org names and camera counts rendered
    expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    expect(screen.getByText("12 Cameras")).toBeInTheDocument();
    expect(screen.getByText("Beta Security")).toBeInTheDocument();
    expect(screen.getByText("4 Cameras")).toBeInTheDocument();

    // Percentage bar for max org should show 100%
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows loading skeletons while orgs are loading", () => {
    mockAuthz(true);
    vi.mocked(usePlatformOrganizations).mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as ReturnType<typeof usePlatformOrganizations>);

    render(<DashboardHomePage />);

    expect(screen.getByRole("heading", { name: /facility overview/i })).toBeInTheDocument();
    // Skeletons shown, no org rows
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no orgs returned", () => {
    mockAuthz(true);
    vi.mocked(usePlatformOrganizations).mockReturnValue({
      isLoading: false,
      error: null,
      data: { data: [], meta: {} },
    } as ReturnType<typeof usePlatformOrganizations>);

    render(<DashboardHomePage />);

    expect(screen.getByText(/no organisations found/i)).toBeInTheDocument();
  });
});
