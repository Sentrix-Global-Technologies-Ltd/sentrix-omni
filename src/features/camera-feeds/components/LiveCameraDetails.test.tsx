import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LiveCameraDetails from "./LiveCameraDetails";
import type { CameraSource } from "../api/camera-feeds.types";

// ── Mock react-router-dom ──────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── Mock useAuthenticatedImage ─────────────────────────────────────────────
vi.mock("../../../hooks/useAuthenticatedImage", () => ({
  useAuthenticatedImage: vi.fn(() => ({ src: null })),
}));

// ── Minimal real camera source ─────────────────────────────────────────────
const LIVE_SOURCE: CameraSource = {
  id: "cam-1",
  type: "ip_camera",
  label: "Gate A",
  organization_id: "org-1",
  site: "HQ",
  zone: "Entrance",
  connection_url: "rtsp://192.168.1.10/stream",
  tags: [],
  status: "active",
  metadata: null,
  last_frame_url: "https://example.com/frame.jpg",
  last_frame_at: "2026-10-18T10:00:00Z",
  feed_status: "live",
  health_score: 95,
  created_at: "2026-01-01T00:00:00Z",
};

const OFFLINE_SOURCE: CameraSource = {
  ...LIVE_SOURCE,
  id: "cam-2",
  label: "Parking Lot",
  feed_status: "offline",
  last_frame_url: null,
  last_frame_at: null,
  health_score: null,
};

describe("LiveCameraDetails", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ── D1: Empty state ──────────────────────────────────────────────────────
  it("D1: renders empty state when no source is selected", () => {
    render(<LiveCameraDetails source={null} />);
    expect(screen.getByText("Select a camera to see details")).toBeInTheDocument();
  });

  // ── D2: Real camera name appears ─────────────────────────────────────────
  it("D2: shows real camera label from API", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    expect(screen.getByText("Gate A")).toBeInTheDocument();
  });

  // ── D3: Online status from feed_status ───────────────────────────────────
  it("D3: shows Online status for live feed_status", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  // ── D4: Offline status for offline feed ──────────────────────────────────
  it("D4: shows Offline status for offline feed_status", () => {
    render(<LiveCameraDetails source={OFFLINE_SOURCE} />);
    // "Offline" appears in both the status row and the live pill
    const offlineEls = screen.getAllByText("Offline");
    expect(offlineEls.length).toBeGreaterThanOrEqual(1);
  });

  // ── D5: Spec rows show em dash fallbacks ────────────────────────────────
  it("D5: Resolution, Frame Rate, Bitrate, Uptime rows show — (em dash) fallback", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    const dashes = screen.getAllByText("—");
    // Resolution, Frame Rate, Bitrate, Uptime, and Last Event time = at least 5
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });

  // ── D6: AI Detection shows No data ──────────────────────────────────────
  it("D6: AI Detection row shows No data", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    // "No data" appears in AI Detection row and Last Event label
    const noDataEls = screen.getAllByText("No data");
    expect(noDataEls.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("AI Detection")).toBeInTheDocument();
  });

  // ── D7: No fabricated "Vehicle Detected" label ───────────────────────────
  it("D7: does NOT show fabricated Vehicle Detected label", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    expect(screen.queryByText("Vehicle Detected")).not.toBeInTheDocument();
  });

  // ── D8: Last Event row always rendered, shows No data + em dash ──────────
  it("D8: Last Event row shows No data label and — timestamp for all sources", () => {
    // Even with last_frame_at present, no event label should appear
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    expect(screen.getByText("Last Event")).toBeInTheDocument();
    // "No data" appears in both AI Detection and Last Event label spans
    const noDataEls = screen.getAllByText("No data");
    expect(noDataEls.length).toBeGreaterThanOrEqual(2);
  });

  // ── D9: Last Event row present even with null last_frame_at ─────────────
  it("D9: Last Event row shown even when last_frame_at is null", () => {
    render(<LiveCameraDetails source={OFFLINE_SOURCE} />);
    expect(screen.getByText("Last Event")).toBeInTheDocument();
  });

  // ── D10: No fabricated spec values anywhere ──────────────────────────────
  it("D10: no fabricated values (1080p, 30 FPS, 4.2 Mbps, 98.7%) are rendered", () => {
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    expect(screen.queryByText(/1080p/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/30 FPS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/4\.2 Mbps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/98\.7%/i)).not.toBeInTheDocument();
  });

  // ── D11: View Camera Details button navigates ────────────────────────────
  it("D11: View Camera Details button navigates to /vision-guard/camera-sources", async () => {
    const user = userEvent.setup();
    render(<LiveCameraDetails source={LIVE_SOURCE} />);
    const btn = screen.getByRole("button", { name: /view full details for Gate A/i });
    await user.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith("/vision-guard/camera-sources");
  });
});
