/**
 * Evidence API — Batch 2 filter tests.
 *
 * Covers:
 *   T1  camera_source_id forwarded
 *   T2  from / to forwarded; to gets T23:59:59 appended (end-of-day fix)
 *   T3  attribute facets forwarded (color / make / model / item)
 *   T4  empty / undefined values omitted from request params
 *   T5  cursor reset contract (verified at the EvidenceFilters level)
 *   T6  demo isolation — API failure must never resolve to demo fallback
 *       (this is tested in EvidenceConsolePage; here we confirm search() rejects
 *        on non-2xx so the error branch is reachable)
 *
 * Strategy: stub global fetch, call evidenceApi.search(), then inspect the URL
 * that fetch received.  apiClient.get() builds the URL via URLSearchParams and
 * passes it to fetch as the first argument, so we can parse it reliably.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { evidenceApi } from "./evidence.api";
import { apiClient } from "../../../services/api/client";
import { tokenStorage } from "../../../services/api/tokenStorage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse(data: unknown = []): Response {
  return new Response(
    JSON.stringify({ success: true, message: "ok", data, meta: {} }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function errorResponse(status = 500): Response {
  return new Response(
    JSON.stringify({ success: false, message: "error" }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

/** Extract query-string params from the URL fetch was called with. */
function capturedParams(fetchMock: ReturnType<typeof vi.fn>): URLSearchParams {
  const url = fetchMock.mock.calls[0][0] as string;
  const qs = url.includes("?") ? url.split("?")[1] : "";
  return new URLSearchParams(qs);
}

const ORG = "org-abc";

beforeEach(() => {
  tokenStorage.clear();
  apiClient.setActiveOrganizationId(null);
  apiClient.setUnauthorizedHandler(null);
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// T1 — camera_source_id forwarded
// ---------------------------------------------------------------------------
describe("T1: camera_source_id", () => {
  it("sends camera_source_id when set", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { camera_source_id: "uuid-1234" });

    const params = capturedParams(fetchMock);
    expect(params.get("camera_source_id")).toBe("uuid-1234");
  });

  it("omits camera_source_id when undefined", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, {});

    const params = capturedParams(fetchMock);
    expect(params.has("camera_source_id")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T2 — date range params; end-of-day semantics for `to`
// ---------------------------------------------------------------------------
describe("T2: date range (from / to)", () => {
  it("sends from as-is", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { from: "2024-01-01" });

    const params = capturedParams(fetchMock);
    expect(params.get("from")).toBe("2024-01-01");
  });

  it("appends T23:59:59 to `to` so Carbon includes the full end date", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { to: "2024-01-31" });

    const params = capturedParams(fetchMock);
    // Must be end-of-day, not midnight — the whole point of the fix.
    expect(params.get("to")).toBe("2024-01-31T23:59:59");
    expect(params.get("to")).not.toBe("2024-01-31");
  });

  it("sends both from and to together", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { from: "2024-01-01", to: "2024-01-31" });

    const params = capturedParams(fetchMock);
    expect(params.get("from")).toBe("2024-01-01");
    expect(params.get("to")).toBe("2024-01-31T23:59:59");
  });

  it("omits from and to when undefined", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, {});

    const params = capturedParams(fetchMock);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T3 — attribute facets (color / make / model / item)
// ---------------------------------------------------------------------------
describe("T3: attribute facets", () => {
  it("sends color when set", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { color: "silver" });

    expect(capturedParams(fetchMock).get("color")).toBe("silver");
  });

  it("sends make when set", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { make: "Toyota" });

    expect(capturedParams(fetchMock).get("make")).toBe("Toyota");
  });

  it("sends model when set", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { model: "Camry" });

    expect(capturedParams(fetchMock).get("model")).toBe("Camry");
  });

  it("sends item when set", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { item: "backpack" });

    expect(capturedParams(fetchMock).get("item")).toBe("backpack");
  });

  it("sends all four attribute facets together", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, {
      color: "red",
      make: "Honda",
      model: "Civic",
      item: "helmet",
    });

    const params = capturedParams(fetchMock);
    expect(params.get("color")).toBe("red");
    expect(params.get("make")).toBe("Honda");
    expect(params.get("model")).toBe("Civic");
    expect(params.get("item")).toBe("helmet");
  });

  it("omits all attribute facets when undefined", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, {});

    const params = capturedParams(fetchMock);
    expect(params.has("color")).toBe(false);
    expect(params.has("make")).toBe(false);
    expect(params.has("model")).toBe(false);
    expect(params.has("item")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T4 — empty string values are omitted
// ---------------------------------------------------------------------------
describe("T4: empty string values omitted", () => {
  it("omits camera_source_id when empty string", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    // TypeScript prevents assigning "" to camera_source_id at the call site,
    // but runtime callers may pass an empty string from a cleared input.
    await evidenceApi.search(ORG, { camera_source_id: "" as string | undefined });

    expect(capturedParams(fetchMock).has("camera_source_id")).toBe(false);
  });

  it("omits color when empty string", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { color: "" as string | undefined });

    expect(capturedParams(fetchMock).has("color")).toBe(false);
  });

  it("omits from when empty string", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { from: "" as string | undefined });

    expect(capturedParams(fetchMock).has("from")).toBe(false);
  });

  it("omits to when empty string (no T23:59:59 appended to empty value)", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, { to: "" as string | undefined });

    expect(capturedParams(fetchMock).has("to")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T5 — existing filters still forwarded (regression guard)
// ---------------------------------------------------------------------------
describe("T5: existing filters still work", () => {
  it("still forwards kind, severity, plate, status, q, cursor", async () => {
    const fetchMock = vi.fn(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);

    await evidenceApi.search(ORG, {
      kind: "vehicle",
      severity: "high",
      plate: "ABC123",
      status: "hold",
      q: "parking",
      cursor: "tok_abc",
    });

    const params = capturedParams(fetchMock);
    expect(params.get("kind")).toBe("vehicle");
    expect(params.get("severity")).toBe("high");
    expect(params.get("plate")).toBe("ABC123");
    expect(params.get("status")).toBe("hold");
    expect(params.get("q")).toBe("parking");
    expect(params.get("cursor")).toBe("tok_abc");
  });
});

// ---------------------------------------------------------------------------
// T6 — search() rejects on API error (demo fallback guard)
// ---------------------------------------------------------------------------
describe("T6: API error surfaces as rejection (enables error branch in UI)", () => {
  it("rejects on 500 so the UI never silently falls through to demo data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => errorResponse(500)));

    await expect(evidenceApi.search(ORG, {})).rejects.toBeDefined();
  });

  it("rejects on 403 so the UI shows the error state", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => errorResponse(403)));

    await expect(evidenceApi.search(ORG, {})).rejects.toBeDefined();
  });
});
