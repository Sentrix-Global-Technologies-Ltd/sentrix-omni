/** Hardware (device fleet) types — mirror the backend DeviceResource. */

export interface Device {
  id: string;
  organization_id: string;
  registered_by: string | null;
  kind: string;
  serial: string;
  name: string | null;
  site: string | null;
  zone: string | null;
  status: string;
  last_seen_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface DeviceFilters {
  status?: string;
  kind?: string;
  page?: number;
  /** When true, retired devices are excluded from the results (backend exclude_retired param). */
  excludeRetired?: boolean;
}

/** DeviceKind values — mirrors backend DeviceKind enum. */
export const DEVICE_KINDS = [
  { value: "gate_scanner", label: "Gate Scanner" },
  { value: "panic_button", label: "Panic Button" },
  { value: "sensor",       label: "Sensor" },
  { value: "controller",   label: "Controller" },
  { value: "beacon",       label: "Beacon" },
  { value: "other",        label: "Other" },
] as const;

export type DeviceKindValue = (typeof DEVICE_KINDS)[number]["value"];

/** Payload for POST /organizations/{org}/hardware */
export interface RegisterDevicePayload {
  kind: DeviceKindValue;
  serial: string;
  name: string;
  site?: string | null;
  zone?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Device status values — mirrors backend DeviceStatus enum. */
export type DeviceStatusValue = "active" | "offline" | "maintenance" | "retired";

/**
 * Payload for PATCH /organizations/{org}/hardware/{device}/status
 * reason is required when transitioning to maintenance or retired.
 */
export interface TransitionDeviceStatusPayload {
  status: DeviceStatusValue;
  reason?: string;
}

/** Allowed operator-initiated transitions from a given status (mirrors backend graph). */
export const ALLOWED_TRANSITIONS: Record<DeviceStatusValue, DeviceStatusValue[]> = {
  active:      ["maintenance", "retired"],
  maintenance: ["active", "retired"],
  offline:     [],  // connectivity-derived — no operator transitions
  retired:     [],  // terminal
};

/** Statuses that require a non-empty reason. */
export const REQUIRES_REASON: DeviceStatusValue[] = ["maintenance", "retired"];

/**
 * Diagnosis health values returned by POST /organizations/{org}/hardware/{device}/diagnose.
 * Mirrors DeviceService::health() (backend read-only, no state change).
 *
 *   online         — Active and recently seen (within the stale threshold).
 *   stale          — Active but heartbeat exceeded the stale threshold, or no last_seen_at.
 *   offline        — Device has DeviceStatus::Offline.
 *   maintenance    — Device is intentionally out of service.
 *   decommissioned — Device has been permanently retired.
 */
export type DiagnoseHealth =
  | "online"
  | "stale"
  | "offline"
  | "maintenance"
  | "decommissioned";

/** Typed result from the diagnosis endpoint. */
export interface DiagnoseResult {
  status: string;
  last_seen_at: string | null;
  health: DiagnoseHealth;
}

