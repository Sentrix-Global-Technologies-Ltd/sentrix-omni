import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { env } from "../config/env";
import { tokenStorage } from "../services/api/tokenStorage";
import { apiPathFromUrl, useAuthenticatedImage } from "./useAuthenticatedImage";

const FRAME =
  "http://some-backend-host/api/v1/organizations/org-1/vision-guard/camera-sources/cam-1/frame";

let created = 0;
const revoked: string[] = [];

beforeEach(() => {
  created = 0;
  revoked.length = 0;
  tokenStorage.set("tok-abc");
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn(() => `blob:frame-${++created}`),
    revokeObjectURL: vi.fn((u: string) => void revoked.push(u)),
  }));
});

afterEach(() => {
  tokenStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function imageResponse(status = 200): Response {
  return new Response(new Blob(["jpeg-bytes"], { type: "image/jpeg" }), { status });
}

describe("apiPathFromUrl", () => {
  it("extracts the path under the API version prefix", () => {
    expect(apiPathFromUrl(FRAME)).toBe("organizations/org-1/vision-guard/camera-sources/cam-1/frame");
  });

  it("refuses URLs outside the API (no token leakage to other paths/hosts)", () => {
    expect(apiPathFromUrl("http://evil.example/storage/frames/x/current.jpg")).toBeNull();
    expect(apiPathFromUrl("not a url at all")).toBeNull();
  });
});

describe("useAuthenticatedImage", () => {
  it("fetches with the bearer token against the dashboard's own API base", async () => {
    const fetchMock = vi.fn(async () => imageResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuthenticatedImage(FRAME, "t1"));

    await waitFor(() => expect(result.current.src).toBe("blob:frame-1"));
    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe(`${env.apiBaseUrl}/organizations/org-1/vision-guard/camera-sources/cam-1/frame`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-abc");
    expect(result.current.status).toBe("idle");
  });

  it("re-fetches when the version changes and revokes the previous blob", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => imageResponse()));

    const { result, rerender } = renderHook(({ v }) => useAuthenticatedImage(FRAME, v), {
      initialProps: { v: "t1" },
    });
    await waitFor(() => expect(result.current.src).toBe("blob:frame-1"));

    rerender({ v: "t2" });
    await waitFor(() => expect(result.current.src).toBe("blob:frame-2"));
    expect(revoked).toContain("blob:frame-1");
  });

  it("revokes the blob on unmount", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => imageResponse()));

    const { result, unmount } = renderHook(() => useAuthenticatedImage(FRAME, "t1"));
    await waitFor(() => expect(result.current.src).toBe("blob:frame-1"));

    unmount();
    expect(revoked).toContain("blob:frame-1");
  });

  it("reports an error and shows nothing when the API denies the image", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => imageResponse(403)));

    const { result } = renderHook(() => useAuthenticatedImage(FRAME, "t1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.src).toBeNull();
  });

  it("does nothing without a URL", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuthenticatedImage(null, null));

    expect(result.current).toEqual({ src: null, status: "idle" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
