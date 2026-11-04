/**
 * PSN-1  Headline cards use the shared accent card design with their accents.
 * PSN-2  Severity breakdown renders one accent card per severity, in low→critical order.
 * PSN-3  No open incidents shows the empty message.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PlatformSnapshotPage from "./PlatformSnapshotPage";

vi.mock("../../../components/common/PageMeta", () => ({ default: () => null }));
vi.mock("react-router", async (orig) => ({ ...(await orig<object>()), Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

const hook = vi.hoisted(() => ({ usePlatformSnapshot: vi.fn() }));
vi.mock("../hooks/usePlatformSnapshot", () => hook);

import { MemoryRouter } from "react-router";

const setup = (data: object) => {
  hook.usePlatformSnapshot.mockReturnValue({ isLoading: false, data: { data } });
  return render(
    <MemoryRouter>
      <PlatformSnapshotPage />
    </MemoryRouter>,
  );
};

beforeEach(() => vi.clearAllMocks());

describe("PlatformSnapshotPage", () => {
  it("PSN-1 headline cards use accent cards", () => {
    const { container } = setup({ open_incidents_total: 4, active_emergencies: 1, on_duty_responders: 7, open_incidents_by_severity: {} });
    expect(container.querySelectorAll(".ic-stat-card").length).toBe(3);
    expect(container.querySelector(".ic-stat-accent--warning")).not.toBeNull();
    expect(container.querySelector(".ic-stat-accent--critical")).not.toBeNull();
    expect(container.querySelector(".ic-stat-accent--success")).not.toBeNull();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("PSN-2 severity cards are ordered low to critical", () => {
    const { container } = setup({
      open_incidents_total: 6, active_emergencies: 0, on_duty_responders: 0,
      open_incidents_by_severity: { critical: 1, low: 3, high: 2 },
    });
    const labels = Array.from(container.querySelectorAll(".ic-stat-label")).map((n) => n.textContent);
    expect(labels.slice(3)).toEqual(["Low", "High", "Critical"]);
  });

  it("PSN-3 empty state", () => {
    setup({ open_incidents_total: 0, active_emergencies: 0, on_duty_responders: 0, open_incidents_by_severity: {} });
    expect(screen.getByText("No open incidents.")).toBeInTheDocument();
  });
});
