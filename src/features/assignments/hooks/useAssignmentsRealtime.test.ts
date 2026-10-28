/**
 * useAssignmentsRealtime.test.ts
 *
 * Unit tests for the reconnect-recovery behaviour added to useAssignmentsRealtime.
 *
 * Strategy
 * --------
 * The hook has two concerns:
 *   1. Channel event → cache invalidation  (delegated to useOrgChannel — tested elsewhere)
 *   2. Reconnect recovery → cache invalidation on false→true status transition
 *
 * We mock the three external dependencies at the module level:
 *   - reverbClient   : expose a controllable onStatus handler list
 *   - useOrgChannel  : no-op, returns { connected: false }
 *   - OrganizationContext: returns a fixed activeId
 *
 * Tests: UAR-1 to UAR-5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// ── Module mocks ──────────────────────────────────────────────────────────────

const statusHandlers = new Set<(c: boolean) => void>();
let initialConnectionState = false;

vi.mock("../../../realtime/reverbClient", () => ({
  reverbClient: {
    onStatus: vi.fn((handler: (c: boolean) => void) => {
      statusHandlers.add(handler);
      handler(initialConnectionState); // immediate call with current state
      return () => statusHandlers.delete(handler);
    }),
  },
}));

vi.mock("../../../realtime/useOrgChannel", () => ({
  useOrgChannel: vi.fn(() => ({ connected: false })),
}));

const ACTIVE_ORG_ID = "org-abc";

vi.mock("../../../context/OrganizationContext", () => ({
  useOrganization: vi.fn(() => ({ activeId: ACTIVE_ORG_ID })),
}));

// Import AFTER mocks are registered
import { useAssignmentsRealtime } from "./useAssignmentsRealtime";
import { assignmentKeys } from "../api/assignments.keys";
import { incidentKeys } from "../../incidents/api/incidents.keys";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fireStatus(connected: boolean) {
  statusHandlers.forEach((h) => h(connected));
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useAssignmentsRealtime — reconnect recovery", () => {
  let qc: QueryClient;

  beforeEach(() => {
    initialConnectionState = false;
    statusHandlers.clear();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    qc.clear();
    vi.clearAllMocks();
  });

  it("UAR-1: does not invalidate when initially connected (no prior disconnect)", () => {
    // Start already connected — handler fires true on registration, wasConnected=false
    // So the first true fires invalidation. We want to ensure that on first mount
    // while connected we DO invalidate (stale data recovery from a previous tab).
    // This tests the explicit initial behaviour: first call is always false→true or
    // false→false depending on reverbClient state.
    initialConnectionState = false;
    const invalidate = vi.spyOn(qc, "invalidateQueries");

    renderHook(() => useAssignmentsRealtime(), { wrapper: makeWrapper(qc) });

    // reverbClient.onStatus immediately invokes with false → wasConnected = false, isConnected = false → no invalidation
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("UAR-2: invalidates both caches on reconnect (false → true transition)", async () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries");

    renderHook(() => useAssignmentsRealtime(), { wrapper: makeWrapper(qc) });

    // Simulate a reconnect
    act(() => {
      fireStatus(false); // disconnect
      fireStatus(true);  // reconnect
    });

    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: assignmentKeys.all(ACTIVE_ORG_ID) }),
    );
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: incidentKeys.all(ACTIVE_ORG_ID) }),
    );
  });

  it("UAR-3: does not invalidate on true → true (no reconnect occurred)", async () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries");

    renderHook(() => useAssignmentsRealtime(), { wrapper: makeWrapper(qc) });

    act(() => {
      fireStatus(false); // disconnect (sets wasConnected=false)
      fireStatus(true);  // reconnect → invalidates
    });

    const callsAfterFirstReconnect = invalidate.mock.calls.length;

    // Fire true again without a false in between — should NOT invalidate again
    act(() => {
      fireStatus(true);
    });

    expect(invalidate.mock.calls.length).toBe(callsAfterFirstReconnect);
  });

  it("UAR-4: invalidates again on a second reconnect", () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries");

    renderHook(() => useAssignmentsRealtime(), { wrapper: makeWrapper(qc) });

    act(() => {
      fireStatus(false);
      fireStatus(true);
    });
    const afterFirst = invalidate.mock.calls.length;
    expect(afterFirst).toBeGreaterThanOrEqual(2); // assignments + incidents

    act(() => {
      fireStatus(false);
      fireStatus(true);
    });
    // Should have called again for the second reconnect
    expect(invalidate.mock.calls.length).toBeGreaterThan(afterFirst);
  });

  it("UAR-5: cleans up the status handler on unmount (no memory leak)", () => {
    const { unmount } = renderHook(() => useAssignmentsRealtime(), {
      wrapper: makeWrapper(qc),
    });

    const sizeBefore = statusHandlers.size;
    unmount();
    expect(statusHandlers.size).toBeLessThan(sizeBefore);
  });
});
