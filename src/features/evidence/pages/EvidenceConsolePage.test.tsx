/**
 * EvidenceConsolePage — focused behavioural tests.
 *
 * Tests covered:
 *   C1  Clicking a card populates Evidence Details drawer.
 *   C2  Clicking the same card again deselects it (drawer resets to empty).
 *   C3  Clicking a different card swaps the drawer contents.
 *   C4  Choosing a kind in Filters → Kind passes that kind to useEvidenceSearch.
 *   C5  Choosing "All kinds" clears the kind filter (kind → undefined).
 *   C6  Pagination cursor is reset (undefined) on every kind change.
 *   C7  The Kind dropdown reflects the active filters.kind value.
 *   C8  Selecting an observation and then changing the kind filter clears
 *       the selection when the selected card is no longer in the display.
 *   C9  An API error from useEvidenceSearch never surfaces demo records
 *       (error state is distinct from empty state).
 *   C10 Actions section shows "unavailable" notice for observations whose id
 *       starts with "demo-" (drawer disables actions for demo records).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Observation } from "../api/evidence.types";

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

vi.mock("../../../hooks/useAuthz", () => ({
  useAuthz: () => ({ isAllowed: () => true }),
}));

vi.mock("../../audit/hooks/useAuditLogs", () => ({
  useAuditLogs: () => ({ isLoading: false, error: null, data: { data: [] } }),
}));

vi.mock("../hooks/useEvidenceActions", () => ({
  useObservationActions: () => ({
    bookmark: { mutateAsync: vi.fn() },
    hold: { mutateAsync: vi.fn() },
  }),
  useEvidenceCollectionActions: () => ({
    create: { mutateAsync: vi.fn(), isPending: false },
    addObservations: { mutateAsync: vi.fn(), isPending: false },
    removeObservations: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

vi.mock("../../camera-feeds/hooks/useCameraFeeds", () => ({
  useCameraFeeds: () => ({ isLoading: false, data: { data: [] } }),
}));

vi.mock("../hooks/useEvidence", () => ({
  useEvidenceSearch: vi.fn(),
  useEvidenceStats: vi.fn(),
  useEvidenceCollections: vi.fn(() => ({
    isLoading: false,
    error: null,
    data: { data: [], meta: {} },
  })),
}));

// Toast — prevent "useToast must be used within a ToastProvider" from
// CollectionsTab sub-components (CreateCollectionModal / CollectionDetailModal).
vi.mock("../../../components/shared/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn() }),
}));

/* ─── Imports after mocks ────────────────────────────────────────────────── */
import EvidenceConsolePage from "./EvidenceConsolePage";
import { useEvidenceSearch, useEvidenceStats } from "../hooks/useEvidence";

/* ─── Fixtures ───────────────────────────────────────────────────────────── */

function makeObs(partial: Partial<Observation>): Observation {
  return {
    id: "obs-1",
    organization_id: "org-test",
    camera_source_id: null,
    kind: "vehicle",
    label: "Vehicle at Gate",
    attributes: { camera_name: "CAM-01", location_name: "North Gate", site_name: "HQ" },
    plate: null,
    confidence: 0.9,
    severity: "low",
    snapshot_url: null,
    clip_url: null,
    lat: null,
    lng: null,
    observed_at: new Date(Date.now() - 60_000).toISOString(),
    hold: false,
    bookmarked: false,
    sealed: false,
    retention_tier: "hot",
    created_at: new Date(Date.now() - 60_000).toISOString(),
    ...partial,
  };
}

const vehicleObs = makeObs({ id: "obs-vehicle", kind: "vehicle", label: "Vehicle at Gate" });
const faceObs    = makeObs({ id: "obs-face",    kind: "face",    label: "Face at Entrance" });
const demoObs    = makeObs({ id: "demo-1", kind: "vehicle", label: "Demo Vehicle", organization_id: "demo-org" });

function emptySearch(override = {}) {
  return { isLoading: false, error: null, data: { data: [], meta: {} }, refetch: vi.fn(), ...override };
}

function statsFor(by_kind: Record<string, number>) {
  return {
    isLoading: false,
    error: null,
    data: { data: { total: Object.values(by_kind).reduce((a, b) => a + b, 0), by_kind } },
  };
}

/* ─── Setup ──────────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.mocked(useEvidenceSearch).mockImplementation((filters) => ({
    ...emptySearch(),
    data: {
      data: filters.kind === "vehicle" ? [vehicleObs]
          : filters.kind === "face"    ? [faceObs]
          : [vehicleObs, faceObs],
      meta: {},
    },
  }));

  vi.mocked(useEvidenceStats).mockReturnValue(
    statsFor({ vehicle: 1, face: 1 }) as ReturnType<typeof useEvidenceStats>,
  );
});

function latestFilters() {
  const calls = vi.mocked(useEvidenceSearch).mock.calls;
  return calls.at(-1)?.[0];
}

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("EvidenceConsolePage — card selection", () => {
  it("C1: clicking a card populates the Evidence Details drawer", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    expect(screen.getByText("No evidence selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Vehicle at Gate/i }));

    const drawer = screen.getByRole("complementary", { name: /evidence details/i });
    expect(within(drawer).getByRole("heading", { level: 3, name: /Vehicle at Gate/i })).toBeInTheDocument();
  });

  it("C2: clicking the selected card again deselects it", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    const card = screen.getByRole("button", { name: /Vehicle at Gate/i });
    await user.click(card);
    expect(screen.queryByText("No evidence selected")).not.toBeInTheDocument();

    await user.click(card);
    expect(screen.getByText("No evidence selected")).toBeInTheDocument();
  });

  it("C3: clicking a different card swaps the drawer", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    await user.click(screen.getByRole("button", { name: /Vehicle at Gate/i }));
    const drawer = screen.getByRole("complementary", { name: /evidence details/i });
    expect(within(drawer).getByRole("heading", { level: 3, name: /Vehicle at Gate/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Face at Entrance/i }));
    expect(within(drawer).getByRole("heading", { level: 3, name: /Face at Entrance/i })).toBeInTheDocument();
    expect(within(drawer).queryByRole("heading", { level: 3, name: /Vehicle at Gate/i })).not.toBeInTheDocument();
  });
});

async function openKindSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /filters/i }));
  return screen.getByRole("combobox", { name: /kind/i });
}

describe("EvidenceConsolePage — kind filtering (Filters → Kind)", () => {
  it("C4: choosing Vehicle in the Kind dropdown passes kind=vehicle to useEvidenceSearch", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    expect(latestFilters()?.kind).toBeUndefined();
    await user.selectOptions(await openKindSelect(user), "vehicle");
    expect(latestFilters()?.kind).toBe("vehicle");
  });

  it("C5: choosing All kinds clears the kind filter", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    const kindSelect = await openKindSelect(user);
    await user.selectOptions(kindSelect, "vehicle");
    expect(latestFilters()?.kind).toBe("vehicle");

    await user.selectOptions(kindSelect, "");
    expect(latestFilters()?.kind).toBeUndefined();
  });

  it("C6: every kind change resets the pagination cursor to undefined", async () => {
    vi.mocked(useEvidenceSearch).mockImplementation((filters) => ({
      ...emptySearch(),
      data: {
        data: filters.kind === "face" ? [faceObs] : [vehicleObs, faceObs],
        meta: { next_cursor: "cursor-2" },
      },
    }) as unknown as ReturnType<typeof useEvidenceSearch>);

    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    // Move to a later page so a real cursor is in the filters.
    await user.click(screen.getByRole("button", { name: /older/i }));
    expect(latestFilters()?.cursor).toBe("cursor-2");

    // Changing the kind must drop that cursor.
    await user.selectOptions(await openKindSelect(user), "face");
    expect(latestFilters()?.kind).toBe("face");
    expect(latestFilters()?.cursor).toBeUndefined();
  });

  it("C7: the Kind dropdown reflects the active filters.kind", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    const kindSelect = await openKindSelect(user);
    expect(kindSelect).toHaveValue("");

    await user.selectOptions(kindSelect, "vehicle");
    expect(kindSelect).toHaveValue("vehicle");

    await user.selectOptions(kindSelect, "face");
    expect(kindSelect).toHaveValue("face");
    expect(latestFilters()?.kind).toBe("face");
  });
});

describe("EvidenceConsolePage — selection reconciliation", () => {
  it("C8: selection is cleared when the selected card leaves the display set", async () => {
    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    await user.click(screen.getByRole("button", { name: /Vehicle at Gate/i }));
    // Verify drawer is populated with vehicle details
    expect(
      within(screen.getByRole("complementary", { name: /evidence details/i }))
        .getByRole("heading", { level: 3, name: /Vehicle at Gate/i })
    ).toBeInTheDocument();

    // Switch Kind to Face — vehicle obs leaves the display set.
    // React will unmount the populated drawer aside and mount the empty-state
    // aside, so we re-query rather than holding a stale reference.
    await user.selectOptions(await openKindSelect(user), "face");
    expect(
      within(screen.getByRole("complementary", { name: /evidence details/i }))
        .getByText("No evidence selected")
    ).toBeInTheDocument();
  });
});

describe("EvidenceConsolePage — API error / demo isolation", () => {
  it("C9: an API error never surfaces demo records — error state is shown instead", () => {
    vi.mocked(useEvidenceSearch).mockReturnValue({
      ...emptySearch(),
      isLoading: false,
      error: new Error("500"),
      data: undefined,
    } as unknown as ReturnType<typeof useEvidenceSearch>);

    render(<EvidenceConsolePage />);

    expect(screen.getByText(/Failed to load observations/i)).toBeInTheDocument();
    expect(screen.queryByText(/demo data/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Vehicle at Gate/i })).not.toBeInTheDocument();
  });
});

describe("EvidenceConsolePage — demo record actions", () => {
  it("C10: drawer shows action-unavailable notice for demo-prefixed observations", async () => {
    vi.mocked(useEvidenceSearch).mockReturnValue({
      ...emptySearch(),
      data: { data: [demoObs], meta: {} },
    } as unknown as ReturnType<typeof useEvidenceSearch>);

    const user = userEvent.setup();
    render(<EvidenceConsolePage />);

    // demo-ID guard removed — drawer now opens
    await user.click(screen.getByRole("button", { name: /Demo Vehicle/i }));

    const drawer = screen.getByRole("complementary", { name: /evidence details/i });
    expect(within(drawer).getByRole("heading", { level: 3, name: /Demo Vehicle/i })).toBeInTheDocument();

    // Actions section shows notice
    expect(within(drawer).getByText(/Actions unavailable for demo records/i)).toBeInTheDocument();

    // No action buttons for demo records
    expect(within(drawer).queryByRole("button", { name: /bookmark/i })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: /legal hold/i })).not.toBeInTheDocument();
  });
});
