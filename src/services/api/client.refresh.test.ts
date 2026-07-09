import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "./client";
import { tokenStorage } from "./tokenStorage";
import { UnauthorizedError } from "./errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  tokenStorage.clear();
  apiClient.setActiveOrganizationId(null);
  apiClient.setUnauthorizedHandler(null);
  apiClient.setRefreshHandler(null);
  vi.restoreAllMocks();
});

afterEach(() => {
  apiClient.setRefreshHandler(null);
  apiClient.setUnauthorizedHandler(null);
});

describe("apiClient silent refresh", () => {
  it("refreshes once on 401 and replays the original request with the new token", async () => {
    tokenStorage.set("stale-access");
    const refresh = vi.fn(async () => {
      tokenStorage.set("fresh-access");
      return true;
    });
    apiClient.setRefreshHandler(refresh);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, message: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiClient.get<{ ok: boolean }>("things");

    expect(res.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const retryInit = fetchMock.mock.calls[1][1] as { headers: Record<string, string> };
    expect(retryInit.headers.Authorization).toBe("Bearer fresh-access");
  });

  it("logs out (clears token + notifies + throws) when the refresh fails", async () => {
    tokenStorage.set("stale-access");
    const onUnauthorized = vi.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    apiClient.setRefreshHandler(async () => false);

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ success: false, message: "nope" }, 401)));

    await expect(apiClient.get("secure")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(tokenStorage.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not retry the refresh call itself (skipRefresh)", async () => {
    tokenStorage.set("stale");
    const refresh = vi.fn(async () => true);
    apiClient.setRefreshHandler(refresh);

    const fetchMock = vi.fn(async () => jsonResponse({ success: false, message: "bad refresh" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiClient.post("auth/refresh", undefined, { auth: false, bearer: "rt", skipRefresh: true }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    // The refresh endpoint must never trigger the silent-refresh loop on itself.
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("de-duplicates concurrent refreshes into a single refresh call", async () => {
    tokenStorage.set("stale");
    let refreshCalls = 0;
    apiClient.setRefreshHandler(async () => {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      tokenStorage.set("fresh");
      return true;
    });

    const fetchMock = vi.fn(async (_url: string, init: { headers: Record<string, string> }) =>
      init.headers.Authorization === "Bearer fresh"
        ? jsonResponse({ success: true, data: { ok: true } })
        : jsonResponse({ success: false }, 401),
    );
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([apiClient.get("a"), apiClient.get("b")]);

    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });
});
