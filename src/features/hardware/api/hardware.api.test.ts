/**
 * hardware.api.ts — regression tests for the Register Device endpoint.
 *
 * Root cause being guarded: `hardwareApi.create()` previously wrapped the
 * payload in `{ json: payload }` before passing it to `apiClient.post()`.
 * Because `apiClient.post(path, body, opts?)` treats the second arg as the
 * JSON body directly, the server received `{"json": {"kind":...}}` instead of
 * `{"kind":...}` — causing Laravel to report "The kind field is required".
 *
 * Tests:
 *   HA-1  create() sends the payload as the top-level JSON body (not nested)
 *   HA-2  create() sends all required fields: kind, serial, name
 *   HA-3  create() sends optional site and zone fields when provided
 *   HA-4  create() omits site/zone when null
 *   HA-5  create() uses method POST to the correct path
 *   HA-6  A 422 response throws ValidationError with e.errors populated
 *   HA-7  A 422 with multiple field errors surfaces every field
 *   HA-8  A 500 response throws (not ValidationError — different class)
 *   HA-9  A successful 201 response resolves with device data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hardwareApi } from "./hardware.api";
import { apiClient } from "../../../services/api/client";
import { tokenStorage } from "../../../services/api/tokenStorage";
import { ValidationError } from "../../../services/api/errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG = "org-unit-test";

function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, message: "Created", data }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

function validationErrorResponse(
  errors: Record<string, string[]>,
  message = "The given data was invalid.",
): Response {
  return new Response(
    JSON.stringify({ success: false, message, errors }),
    { status: 422, headers: { "Content-Type": "application/json" } },
  );
}

function serverErrorResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, message: "Internal Server Error" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}

/** Parse the body that fetch received. */
function capturedBody(fetchMock: ReturnType<typeof vi.fn>): unknown {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return JSON.parse(init.body as string);
}

/** Parse the URL path component (without query string). */
function capturedPath(fetchMock: ReturnType<typeof vi.fn>): string {
  const url = fetchMock.mock.calls[0][0] as string;
  return url.split("?")[0];
}

/** The HTTP method fetch was called with. */
function capturedMethod(fetchMock: ReturnType<typeof vi.fn>): string {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return (init.method ?? "GET").toUpperCase();
}

const DEVICE_FIXTURE = {
  id: "dev-1",
  organization_id: ORG,
  registered_by: "user-1",
  kind: "gate_scanner" as const,
  serial: "SN-OOX-20941",
  name: "North Gate - Scanner 1",
  site: "Building A",
  zone: "Reception",
  status: "online" as const,
  last_seen_at: null,
  metadata: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  tokenStorage.clear();
  apiClient.setActiveOrganizationId(null);
  apiClient.setUnauthorizedHandler(null);
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// HA-1 — payload is NOT nested under a "json" key (regression guard)
// ---------------------------------------------------------------------------
describe("HA-1: payload sent as top-level body (regression — not {json:{...}})", () => {
  it("does not wrap the payload in a 'json' key", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "gate_scanner",
      serial: "SN-TEST",
      name: "Test Device",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    // The body must NOT have a "json" key at the top level.
    expect(body).not.toHaveProperty("json");
  });
});

// ---------------------------------------------------------------------------
// HA-2 — required fields present at the top level
// ---------------------------------------------------------------------------
describe("HA-2: required fields forwarded at body root", () => {
  it("sends kind at the top level", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "gate_scanner",
      serial: "SN-TEST",
      name: "Test Device",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.kind).toBe("gate_scanner");
  });

  it("sends serial at the top level", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "sensor",
      serial: "SN-OOX-20941",
      name: "North Gate - Scanner 1",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.serial).toBe("SN-OOX-20941");
  });

  it("sends name at the top level", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "panic_button",
      serial: "SN-PB-01",
      name: "Lobby Panic Button",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.name).toBe("Lobby Panic Button");
  });

  it("sends all enum values for kind without error", async () => {
    const kinds = ["gate_scanner", "panic_button", "sensor", "controller", "beacon", "other"] as const;

    for (const kind of kinds) {
      const fetchMock = vi.fn(async () => successResponse({ ...DEVICE_FIXTURE, kind }));
      vi.stubGlobal("fetch", fetchMock);

      await hardwareApi.create(ORG, { kind, serial: "SN-X", name: "X" });

      const body = capturedBody(fetchMock) as Record<string, unknown>;
      expect(body.kind).toBe(kind);
    }
  });
});

// ---------------------------------------------------------------------------
// HA-3 — optional fields (site, zone) forwarded when provided
// ---------------------------------------------------------------------------
describe("HA-3: optional fields forwarded when provided", () => {
  it("sends site when provided", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "sensor",
      serial: "SN-002",
      name: "Sensor 2",
      site: "Building A",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.site).toBe("Building A");
  });

  it("sends zone when provided", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "sensor",
      serial: "SN-003",
      name: "Sensor 3",
      zone: "Reception",
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.zone).toBe("Reception");
  });
});

// ---------------------------------------------------------------------------
// HA-4 — null site/zone are forwarded as null (not stripped)
// ---------------------------------------------------------------------------
describe("HA-4: null optional fields sent as null", () => {
  it("sends site: null when explicitly null", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "sensor",
      serial: "SN-004",
      name: "Sensor 4",
      site: null,
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.site).toBeNull();
  });

  it("sends zone: null when explicitly null", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, {
      kind: "beacon",
      serial: "SN-005",
      name: "Beacon 5",
      zone: null,
    });

    const body = capturedBody(fetchMock) as Record<string, unknown>;
    expect(body.zone).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// HA-5 — HTTP method and path
// ---------------------------------------------------------------------------
describe("HA-5: uses POST to organizations/{org}/hardware", () => {
  it("uses POST method", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, { kind: "sensor", serial: "SN-X", name: "X" });

    expect(capturedMethod(fetchMock)).toBe("POST");
  });

  it("sends to the organizations/{org}/hardware path", async () => {
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(ORG, { kind: "sensor", serial: "SN-X", name: "X" });

    expect(capturedPath(fetchMock)).toContain(`organizations/${ORG}/hardware`);
  });

  it("scopes path to the correct org (no cross-tenant leak)", async () => {
    const otherOrg = "org-other";
    const fetchMock = vi.fn(async () => successResponse(DEVICE_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await hardwareApi.create(otherOrg, { kind: "sensor", serial: "SN-X", name: "X" });

    expect(capturedPath(fetchMock)).toContain(`organizations/${otherOrg}/hardware`);
    expect(capturedPath(fetchMock)).not.toContain(ORG);
  });
});

// ---------------------------------------------------------------------------
// HA-6 — 422 produces ValidationError with e.errors populated
// ---------------------------------------------------------------------------
describe("HA-6: 422 → ValidationError with e.errors", () => {
  it("throws ValidationError on 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        validationErrorResponse({
          kind: ["The kind field is required."],
          serial: ["The serial field is required."],
          name: ["The name field is required."],
        }),
      ),
    );

    await expect(
      hardwareApi.create(ORG, { kind: "sensor", serial: "", name: "" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("e.errors contains the kind field error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        validationErrorResponse({ kind: ["The kind field is required."] }),
      ),
    );

    let caughtError: unknown;
    try {
      await hardwareApi.create(ORG, { kind: "sensor", serial: "SN-X", name: "X" });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ValidationError);
    expect((caughtError as ValidationError).errors.kind).toEqual([
      "The kind field is required.",
    ]);
  });

  it("e.errors contains the serial field error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        validationErrorResponse({ serial: ["The serial has already been taken."] }),
      ),
    );

    let caughtError: unknown;
    try {
      await hardwareApi.create(ORG, { kind: "sensor", serial: "SN-DUP", name: "Dup" });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ValidationError);
    expect((caughtError as ValidationError).errors.serial).toEqual([
      "The serial has already been taken.",
    ]);
  });
});

// ---------------------------------------------------------------------------
// HA-7 — multiple field errors all surfaced
// ---------------------------------------------------------------------------
describe("HA-7: multiple validation errors all present in e.errors", () => {
  it("e.errors has kind, serial and name keys simultaneously", async () => {
    const errors = {
      kind: ["The kind field is required."],
      serial: ["The serial field is required."],
      name: ["The name field is required."],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => validationErrorResponse(errors)),
    );

    let caughtError: unknown;
    try {
      await hardwareApi.create(ORG, { kind: "other", serial: "", name: "" });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(ValidationError);
    const ve = caughtError as ValidationError;
    expect(ve.errors.kind[0]).toContain("kind");
    expect(ve.errors.serial[0]).toContain("serial");
    expect(ve.errors.name[0]).toContain("name");
  });
});

// ---------------------------------------------------------------------------
// HA-8 — 5xx throws (non-ValidationError)
// ---------------------------------------------------------------------------
describe("HA-8: 5xx response throws but not as ValidationError", () => {
  it("rejects on 500", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => serverErrorResponse()));

    await expect(
      hardwareApi.create(ORG, { kind: "sensor", serial: "SN-X", name: "X" }),
    ).rejects.toBeDefined();
  });

  it("the 500 error is not a ValidationError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => serverErrorResponse()));

    let caughtError: unknown;
    try {
      await hardwareApi.create(ORG, { kind: "sensor", serial: "SN-X", name: "X" });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).not.toBeInstanceOf(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// HA-9 — successful 201 resolves with device data
// ---------------------------------------------------------------------------
describe("HA-9: 201 response resolves with device data", () => {
  it("resolves with the device returned by the server", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => successResponse(DEVICE_FIXTURE)));

    const result = await hardwareApi.create(ORG, {
      kind: "gate_scanner",
      serial: "SN-OOX-20941",
      name: "North Gate - Scanner 1",
    });

    expect(result.data).toMatchObject({
      id: "dev-1",
      kind: "gate_scanner",
      serial: "SN-OOX-20941",
      name: "North Gate - Scanner 1",
    });
  });
});
