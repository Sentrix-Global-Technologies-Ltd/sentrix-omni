/**
 * Safe API error handling: users must see fixed, friendly sentences — never SQL,
 * hosts, table names, stack traces or raw exception text — whatever the backend
 * (or a proxy in front of it) sends back.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./client";
import { authApi } from "./auth";
import { tokenStorage } from "./tokenStorage";
import {
  ApiError,
  NetworkError,
  SAFE_MESSAGES,
  ServerError,
  UnauthorizedError,
  ValidationError,
  errorFromStatus,
  userMessage,
} from "./errors";

const SQL_LEAK =
  'SQLSTATE[42P01]: Undefined table: 7 ERROR: relation "users" does not exist (Connection: pgsql, Host: pgsql, Port: 5432, Database: sentrix, SQL: select * from "users" where "email" = x)';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubFetch(res: Response | (() => Promise<Response>)) {
  vi.stubGlobal("fetch", vi.fn(typeof res === "function" ? res : async () => res));
}

function expectNoInternals(text: string) {
  for (const needle of ["SQLSTATE", "pgsql", "sentrix", "users", "5432", "select", "relation", "Stack trace", ".php"]) {
    expect(text.toLowerCase()).not.toContain(needle.toLowerCase());
  }
}

beforeEach(() => {
  tokenStorage.clear();
  apiClient.setUnauthorizedHandler(null);
  vi.restoreAllMocks();
});

describe("errorFromStatus — message safety", () => {
  it("never surfaces server text for 5xx, even when it contains SQL", () => {
    for (const status of [500, 501, 502, 503, 504]) {
      const e = errorFromStatus(status, SQL_LEAK);
      expect(e).toBeInstanceOf(ServerError);
      expectNoInternals(e.message);
    }
    expect(errorFromStatus(500, SQL_LEAK).message).toBe(SAFE_MESSAGES.generic);
    expect(errorFromStatus(503, SQL_LEAK).message).toBe(SAFE_MESSAGES.unavailable);
    expect(errorFromStatus(502, "<html>Bad gateway</html>").message).toBe(SAFE_MESSAGES.unavailable);
  });

  it("maps the invalid_credentials code to the generic sign-in message", () => {
    const e = errorFromStatus(401, "anything the server said", {}, "invalid_credentials", "req-1");
    expect(e).toBeInstanceOf(UnauthorizedError);
    expect(e.message).toBe("Invalid email or password.");
    expect(e.code).toBe("invalid_credentials");
    expect(e.requestId).toBe("req-1");
  });

  it("drops 4xx server text that looks like internals, keeps ordinary user-facing text", () => {
    expect(errorFromStatus(400, SQL_LEAK).message).toBe(SAFE_MESSAGES.request);
    expect(errorFromStatus(409, "This name is already taken.").message).toBe("This name is already taken.");
    expect(errorFromStatus(404, "No query results for model [App\\Models\\User] 7").message).toBe(SAFE_MESSAGES.notFound);
    expect(errorFromStatus(403, "x").message).toBe(SAFE_MESSAGES.forbidden);
    expect(errorFromStatus(429, "x").message).toBe(SAFE_MESSAGES.tooManyRequests);
  });

  it("keeps safe field-level validation messages and discards unsafe or malformed ones", () => {
    const e = errorFromStatus(422, "The given data was invalid.", {
      email: ["The email field is required."],
      password: [SQL_LEAK],
      weird: "not-an-array" as unknown as string[],
    });
    expect(e).toBeInstanceOf(ValidationError);
    expect(e.errors).toEqual({ email: ["The email field is required."] });
    expect(e.firstError()).toBe("The email field is required.");
  });
});

describe("userMessage", () => {
  it("returns ApiError messages and a generic sentence for anything else", () => {
    expect(userMessage(new ApiError("Nope.", 400))).toBe("Nope.");
    expect(userMessage(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe(SAFE_MESSAGES.generic);
    expect(userMessage("raw string", "Fallback.")).toBe("Fallback.");
    expect(userMessage(undefined)).toBe(SAFE_MESSAGES.generic);
  });
});

describe("apiClient — safe failures", () => {
  it("a raw 500 with the SQL exception from the backend never reaches the UI message", async () => {
    stubFetch(jsonResponse({ success: false, message: SQL_LEAK, errors: {} }, 500));
    const err = await apiClient.get("things").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServerError);
    expect((err as ApiError).message).toBe(SAFE_MESSAGES.generic);
    expectNoInternals((err as ApiError).message);
  });

  it("a 503 shows the temporary-unavailable sentence and carries the request id", async () => {
    stubFetch(
      jsonResponse(
        { success: false, message: "x", code: "service_unavailable", request_id: "abc-123", errors: {} },
        503,
      ),
    );
    const err = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe(SAFE_MESSAGES.unavailable);
    expect(err.code).toBe("service_unavailable");
    expect(err.requestId).toBe("abc-123");
  });

  it("a non-JSON gateway page (HTML 502) becomes a safe unavailable error", async () => {
    stubFetch(new Response("<html><body>502 Bad Gateway nginx/1.25</body></html>", { status: 502 }));
    const err = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ServerError);
    expect(err.message).toBe(SAFE_MESSAGES.unavailable);
  });

  it("a 200 whose body is not the JSON envelope is treated as a malformed response", async () => {
    stubFetch(new Response("<html>captive portal</html>", { status: 200 }));
    const err = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ServerError);
    expect(err.code).toBe("malformed_response");
    expect(err.message).toBe(SAFE_MESSAGES.generic);
  });

  it("an error body with the wrong shape (array / number) does not crash and stays generic", async () => {
    stubFetch(jsonResponse([1, 2, 3], 500));
    const err = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe(SAFE_MESSAGES.generic);
    stubFetch(jsonResponse(42, 500));
    const err2 = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err2.message).toBe(SAFE_MESSAGES.generic);
  });

  it("a network failure is a NetworkError with a friendly message", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    const err = (await apiClient.get("things").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.message).toBe(SAFE_MESSAGES.network);
  });
});

describe("login errors", () => {
  it("invalid credentials (401) show 'Invalid email or password.' and do NOT log the app out", async () => {
    const onUnauthorized = vi.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("existing");
    stubFetch(
      jsonResponse(
        { success: false, message: "Invalid email or password.", code: "invalid_credentials", errors: { email: ["Invalid email or password."] } },
        401,
      ),
    );

    const err = (await authApi.login("a@b.co", "bad").catch((e: unknown) => e)) as ApiError;

    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe("Invalid email or password.");
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toBe("existing");
  });

  it("the reported incident: login hitting a missing users table (500) shows a generic message", async () => {
    stubFetch(jsonResponse({ success: false, message: SQL_LEAK }, 500));
    const err = (await authApi.login("test@example.com", "x").catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe(SAFE_MESSAGES.generic);
    expectNoInternals(err.message);
  });

  it("an unreachable database (503) shows the temporary-unavailable message", async () => {
    stubFetch(jsonResponse({ success: false, message: SQL_LEAK, code: "service_unavailable" }, 503));
    const err = (await authApi.login("test@example.com", "x").catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe(SAFE_MESSAGES.unavailable);
  });
});
