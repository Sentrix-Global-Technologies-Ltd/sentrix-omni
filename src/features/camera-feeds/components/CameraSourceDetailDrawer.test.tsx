/**
 * CameraSourceDetailDrawer — frame preview tests (VS-F series).
 *
 * Tests covered:
 *   VS-F-1  No frame section when last_frame_url is null.
 *   VS-F-2  Shows "Loading…" placeholder while frame is loading.
 *   VS-F-3  Renders authenticated blob URL in <img> once loaded.
 *   VS-F-4  Shows "Frame unavailable" on fetch error.
 *   VS-F-5  Does not render a broken <img src> from the raw last_frame_url.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import CameraSourceDetailDrawer from "./CameraSourceDetailDrawer";
import type { CameraSource } from "../api/camera-feeds.types";

/* ── Mock useAuthenticatedImage ─────────────────────────────────────────── */

vi.mock("../../../hooks/useAuthenticatedImage", () => ({
  useAuthenticatedImage: vi.fn(),
}));

import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
const mockUseAuthenticatedImage = vi.mocked(useAuthenticatedImage);

/* ── Mock Can (permission gate) — always render children in tests ────────── */
vi.mock("../../../components/shared/Can", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/* ── Fixture ────────────────────────────────────────────────────────────── */

function makeSource(overrides: Partial<CameraSource> = {}): CameraSource {
  return {
    id: "cam-001",
    type: "ip_camera",
    label: "Gate Camera",
    organization_id: "org-test",
    site: "Main Campus",
    zone: "North Entrance",
    connection_url: null,
    tags: [],
    status: "active",
    metadata: null,
    last_frame_url: "http://backend.local/api/v1/organizations/org-test/vision-guard/camera-sources/cam-001/frame",
    last_frame_at: "2026-10-23T10:00:00Z",
    feed_status: "live",
    health_score: 95,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function renderDrawer(source: CameraSource | null, onClose = vi.fn()) {
  return render(<CameraSourceDetailDrawer source={source} onClose={onClose} />);
}

/* ── Suite ─────────────────────────────────────────────────────────────── */

describe("CameraSourceDetailDrawer — frame preview (VS-F)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: hook returns loading state
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "loading" });
  });

  /* ── VS-F-1 ──────────────────────────────────────────────────────────── */
  it("VS-F-1: no frame section rendered when last_frame_url is null", () => {
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "idle" });
    const source = makeSource({ last_frame_url: null, last_frame_at: null });
    renderDrawer(source);

    // The loading/error placeholder should not appear
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/frame unavailable/i)).not.toBeInTheDocument();
    // No <img> in the preview slot
    expect(screen.queryByAltText("Latest camera frame")).not.toBeInTheDocument();
  });

  /* ── VS-F-2 ──────────────────────────────────────────────────────────── */
  it("VS-F-2: shows Loading… placeholder while frame is fetching", () => {
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "loading" });
    renderDrawer(makeSource());

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByAltText("Latest camera frame")).not.toBeInTheDocument();
  });

  /* ── VS-F-3 ──────────────────────────────────────────────────────────── */
  it("VS-F-3: renders blob URL in <img> once authentication fetch succeeds", () => {
    const blobUrl = "blob:http://localhost/abc-123";
    mockUseAuthenticatedImage.mockReturnValue({ src: blobUrl, status: "idle" });
    renderDrawer(makeSource());

    const img = screen.getByAltText("Latest camera frame") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe(blobUrl);
    // No loading/error text
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  /* ── VS-F-4 ──────────────────────────────────────────────────────────── */
  it("VS-F-4: shows Frame unavailable when fetch fails", () => {
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "error" });
    renderDrawer(makeSource());

    expect(screen.getByText("Frame unavailable")).toBeInTheDocument();
    expect(screen.queryByAltText("Latest camera frame")).not.toBeInTheDocument();
  });

  /* ── VS-F-5 ──────────────────────────────────────────────────────────── */
  it("VS-F-5: raw last_frame_url is never used as <img> src", () => {
    // Simulate loading — no blob URL yet
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "loading" });
    const source = makeSource();
    renderDrawer(source);

    // The raw backend URL must not appear as any image src
    const imgs = document.querySelectorAll("img");
    imgs.forEach((img) => {
      expect(img.src).not.toBe(source.last_frame_url!);
    });
  });

  /* ── VS-F-6: hook called with correct args ───────────────────────────── */
  it("VS-F-6: useAuthenticatedImage called with last_frame_url and last_frame_at", () => {
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "loading" });
    const source = makeSource();
    renderDrawer(source);

    expect(mockUseAuthenticatedImage).toHaveBeenCalledWith(
      source.last_frame_url,
      source.last_frame_at,
    );
  });

  /* ── VS-F-7: closed drawer (null source) doesn't crash ──────────────── */
  it("VS-F-7: closed drawer (source=null) renders nothing without crashing", () => {
    mockUseAuthenticatedImage.mockReturnValue({ src: null, status: "idle" });
    const { container } = renderDrawer(null);
    expect(container).toBeEmptyDOMElement();
  });
});
