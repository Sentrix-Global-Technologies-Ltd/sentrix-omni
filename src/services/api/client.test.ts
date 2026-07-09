import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./client";
import { tokenStorage } from "./tokenStorage";
import { NetworkError, UnauthorizedError } from "./errors";

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
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  it("unwraps the success envelope into { data, meta }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ success: true, message: "ok", data: [{ id: 1 }], meta: { total: 1 } })),
    );

    const res = await apiClient.get<{ id: number }[]>("things");
    expect(res.data).toEqual([{ id: 1 }]);
    expect(res.meta).toEqual({ total: 1 });
    expect(res.message).toBe("ok");
  });

  it("attaches the bearer token and X-Organization header when authed", async () => {
    tokenStorage.set("tok123");
    apiClient.setActiveOrganizationId("org7");
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get("me");

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Authorization).toBe("Bearer tok123");
    expect(init.headers["X-Organization"]).toBe("org7");
  });

  it("omits auth headers when auth:false", async () => {
    tokenStorage.set("tok123");
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get("public", { auth: false });

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("on 401 clears the token, calls the handler, and throws UnauthorizedError", async () => {
    tokenStorage.set("tok");
    const onUnauthorized = vi.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ success: false, message: "nope" }, 401)));

    await expect(apiClient.get("secure")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(tokenStorage.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("maps a 422 to a ValidationError carrying field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ success: false, message: "invalid", errors: { email: ["required"] } }, 422)),
    );

    await expect(apiClient.post("things", {})).rejects.toMatchObject({
      name: "ValidationError",
      status: 422,
    });
  });

  it("wraps a transport failure in NetworkError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("connection refused");
      }),
    );

    await expect(apiClient.get("things")).rejects.toBeInstanceOf(NetworkError);
  });
});
