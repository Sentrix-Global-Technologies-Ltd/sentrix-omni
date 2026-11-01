import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import VisionGuardIncidentsTable from "./VisionGuardIncidentsTable";
import { useIncidents } from "../../incidents/hooks/useIncidents";

vi.mock("../../incidents/hooks/useIncidents", () => ({ useIncidents: vi.fn() }));

function mockIncidents(value: Record<string, unknown>) {
  vi.mocked(useIncidents).mockReturnValue(value as unknown as ReturnType<typeof useIncidents>);
}

describe("VisionGuardIncidentsTable", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("IT1: renders real incidents and no demo label", () => {
    mockIncidents({
      isLoading: false,
      isError: false,
      data: {
        data: [
          { id: "11111111-aaaa", title: "Real Breach", severity: "high", status: "open", opened_at: new Date().toISOString() },
        ],
      },
    });
    render(<VisionGuardIncidentsTable />);
    expect(screen.getByText("Real Breach")).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("IT2: API error shows an error and never demo rows", () => {
    mockIncidents({ isLoading: false, isError: true, data: undefined });
    render(<VisionGuardIncidentsTable />);
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load incidents/i);
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Perimeter Breach")).not.toBeInTheDocument();
  });

  it("IT3: empty response with demo mode off shows a genuine empty state", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_DEMO_MODE", "false");
    mockIncidents({ isLoading: false, isError: false, data: { data: [] } });
    // The demo gate is evaluated at module load, so re-import with the stubbed env.
    await vi.resetModules();
    const { default: Fresh } = await import("./VisionGuardIncidentsTable");
    render(<Fresh />);
    expect(screen.getByText(/no incidents found/i)).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("IT4: empty response with demo mode on shows clearly labelled demo rows", async () => {
    vi.stubEnv("VITE_DEMO_MODE", "true");
    mockIncidents({ isLoading: false, isError: false, data: { data: [] } });
    await vi.resetModules();
    const { default: Fresh } = await import("./VisionGuardIncidentsTable");
    render(<Fresh />);
    expect(screen.getByText("DEMO DATA")).toBeInTheDocument();
    expect(screen.getAllByText("(demo)").length).toBeGreaterThan(0);
  });
});
