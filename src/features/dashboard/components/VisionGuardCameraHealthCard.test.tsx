import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import VisionGuardCameraHealthCard from "./VisionGuardCameraHealthCard";
import { useCameraSourcesSummary } from "../../camera-feeds/hooks/useCameraFeeds";

vi.mock("../../camera-feeds/hooks/useCameraFeeds", () => ({
  useCameraSourcesSummary: vi.fn(),
}));

function mockSummary(value: Record<string, unknown>) {
  vi.mocked(useCameraSourcesSummary).mockReturnValue(
    value as unknown as ReturnType<typeof useCameraSourcesSummary>,
  );
}

describe("VisionGuardCameraHealthCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("CH1: shows real totals; offline = total - online; warning is — (no API field)", () => {
    mockSummary({ isLoading: false, isError: false, data: { data: { total: 20, online: 15 } } });
    render(<VisionGuardCameraHealthCard />);
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("CH2: API error shows unavailable notice and — instead of invented totals", () => {
    mockSummary({ isLoading: false, isError: true, data: undefined });
    render(<VisionGuardCameraHealthCard />);
    expect(screen.getByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.queryByText("128")).not.toBeInTheDocument();
    expect(screen.queryByText("112")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
