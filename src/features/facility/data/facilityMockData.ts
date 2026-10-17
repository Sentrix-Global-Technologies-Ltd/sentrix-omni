/**
 * Facility Map — illustrative mock dataset for Northfield Corporate Campus.
 * All values are DEMONSTRATION DATA: camera counts, status totals, events and
 * marker positions are not real operational records.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type MarkerStatus = "online" | "idle" | "offline";
export type AlertSeverity = "high" | "medium";
export type EventSeverity = "High" | "Medium" | "Low" | "Cleared";

export interface MockBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  fillDark: string;
  stroke: string;
  cameraCount: number;
}

export interface MockCameraMarker {
  id: string;
  label: string;
  cameraId: string;
  cx: number;
  cy: number;
  status: MarkerStatus;
  buildingId: string | null;
  zone: string;
  type: string;
  resolution: string;
}

export interface MockAlertMarker {
  id: string;
  cx: number;
  cy: number;
  severity: AlertSeverity;
  title: string;
  location: string;
}

export interface MockAccessPoint {
  id: string;
  cx: number;
  cy: number;
  label: string;
}

export interface MockZoneEvent {
  id: string;
  iconKind: "alert-high" | "alert-medium" | "alert-low" | "info" | "check";
  title: string;
  location: string;
  severity: EventSeverity;
  time: string;
  buildingId: string | null;
}

export interface MockSite {
  id: string;
  name: string;
}

// ── Sites ────────────────────────────────────────────────────────────────────

export const MOCK_SITES: MockSite[] = [
  { id: "northfield", name: "Northfield Corporate Campus" },
  { id: "downtown", name: "Downtown Office" },
  { id: "warehouse", name: "Warehouse District" },
];

// ── Buildings ────────────────────────────────────────────────────────────────

export const MOCK_BUILDINGS: MockBuilding[] = [
  {
    id: "bldg-a", name: "Building A",
    x: 325, y: 72, w: 215, h: 148,
    fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.15)", stroke: "#14b8a6",
    cameraCount: 24,
  },
  {
    id: "bldg-b", name: "Building B",
    x: 60, y: 195, w: 208, h: 200,
    fill: "#dbeafe", fillDark: "rgba(59,130,246,0.15)", stroke: "#3b82f6",
    cameraCount: 20,
  },
  {
    id: "bldg-c", name: "Building C",
    x: 590, y: 178, w: 165, h: 155,
    fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.12)", stroke: "#14b8a6",
    cameraCount: 18,
  },
  {
    id: "bldg-d", name: "Building D",
    x: 112, y: 410, w: 205, h: 110,
    fill: "#ccfbf1", fillDark: "rgba(20,184,166,0.15)", stroke: "#14b8a6",
    cameraCount: 16,
  },
  {
    id: "bldg-e", name: "Building E",
    x: 362, y: 400, w: 190, h: 115,
    fill: "#fed7aa", fillDark: "rgba(249,115,22,0.18)", stroke: "#f97316",
    cameraCount: 12,
  },
  {
    id: "parking-a", name: "Parking Lot A",
    x: 582, y: 398, w: 148, h: 107,
    fill: "#f1f5f9", fillDark: "rgba(148,163,184,0.15)", stroke: "#94a3b8",
    cameraCount: 8,
  },
];

// ── Camera Markers ───────────────────────────────────────────────────────────

export const MOCK_CAMERAS: MockCameraMarker[] = [
  { id: "cam-p1", label: "North Gate Camera", cameraId: "P-1", cx: 188, cy: 40, status: "online", buildingId: null, zone: "North Perimeter", type: "Outdoor PTZ", resolution: "4K (3840 × 2160)" },
  { id: "cam-p2", label: "North East Perimeter", cameraId: "P-2", cx: 503, cy: 40, status: "online", buildingId: null, zone: "East Perimeter", type: "Outdoor PTZ", resolution: "1080p" },
  { id: "cam-p3", label: "East Perimeter Cam", cameraId: "P-3", cx: 730, cy: 178, status: "online", buildingId: null, zone: "East Perimeter", type: "Outdoor Fixed", resolution: "1080p" },
  { id: "cam-p4", label: "East Gate Camera", cameraId: "P-4", cx: 730, cy: 365, status: "online", buildingId: null, zone: "East Perimeter", type: "Outdoor PTZ", resolution: "4K (3840 × 2160)" },
  { id: "cam-p5", label: "South East Perimeter", cameraId: "P-5", cx: 596, cy: 530, status: "online", buildingId: null, zone: "South Perimeter", type: "Outdoor Fixed", resolution: "1080p" },
  { id: "cam-p6", label: "Main Entrance Camera", cameraId: "M-1", cx: 424, cy: 530, status: "online", buildingId: null, zone: "Main Entrance", type: "Outdoor PTZ", resolution: "4K (3840 × 2160)" },
  { id: "cam-p7", label: "South West Perimeter", cameraId: "P-6", cx: 294, cy: 530, status: "idle", buildingId: null, zone: "South Perimeter", type: "Outdoor Fixed", resolution: "1080p" },
  { id: "cam-p8", label: "West Gate Camera", cameraId: "P-7", cx: 50, cy: 393, status: "online", buildingId: null, zone: "West Perimeter", type: "Outdoor PTZ", resolution: "1080p" },
  { id: "cam-p9", label: "North West Perimeter", cameraId: "P-8", cx: 50, cy: 232, status: "online", buildingId: null, zone: "West Perimeter", type: "Outdoor Fixed", resolution: "1080p" },
  { id: "cam-e12", label: "Building E - South Entrance", cameraId: "E-12", cx: 456, cy: 460, status: "online", buildingId: "bldg-e", zone: "Building E - South Zone", type: "Outdoor PTZ", resolution: "4K (3840 × 2160)" },
  { id: "cam-b1", label: "Building B - Main Door", cameraId: "B-1", cx: 164, cy: 298, status: "online", buildingId: "bldg-b", zone: "Building B - Lobby", type: "Indoor Fixed", resolution: "1080p" },
  { id: "cam-d1", label: "Loading Dock", cameraId: "D-1", cx: 214, cy: 416, status: "offline", buildingId: "bldg-d", zone: "Building D - Loading", type: "Outdoor Fixed", resolution: "1080p" },
];

// ── Alert Markers ────────────────────────────────────────────────────────────

export const MOCK_ALERTS: MockAlertMarker[] = [
  { id: "alert-1", cx: 418, cy: 80, severity: "high", title: "Perimeter Breach", location: "Building A - North Perimeter" },
  { id: "alert-2", cx: 458, cy: 412, severity: "medium", title: "Loitering Detected", location: "Building E - South Zone" },
];

// ── Access Points ────────────────────────────────────────────────────────────

export const MOCK_ACCESS_POINTS: MockAccessPoint[] = [
  { id: "ap-1", cx: 130, cy: 40, label: "AP-North" },
  { id: "ap-2", cx: 643, cy: 40, label: "AP-NE" },
];

// ── Zone Events ──────────────────────────────────────────────────────────────

export const MOCK_ZONE_EVENTS: MockZoneEvent[] = [
  { id: "evt-1", iconKind: "alert-high", title: "Perimeter Breach", location: "Building A - North Perimeter", severity: "High", time: "2 min ago", buildingId: "bldg-a" },
  { id: "evt-2", iconKind: "alert-medium", title: "Loitering Detected", location: "Parking Lot A", severity: "Medium", time: "5 min ago", buildingId: "parking-a" },
  { id: "evt-3", iconKind: "alert-medium", title: "Vehicle Without Authorization", location: "East Entrance", severity: "Medium", time: "8 min ago", buildingId: null },
  { id: "evt-4", iconKind: "info", title: "AI Model Performance Warning", location: "Cameras Zone 7", severity: "Low", time: "15 min ago", buildingId: null },
  { id: "evt-5", iconKind: "check", title: "All Clear", location: "West Perimeter", severity: "Cleared", time: "22 min ago", buildingId: null },
];

// ── Camera Status ────────────────────────────────────────────────────────────

export const CAMERA_STATUS_COUNTS = { online: 128, idle: 16, offline: 8 };

// ── Layers ───────────────────────────────────────────────────────────────────

export type LayerKey =
  | "cameras"
  | "zones"
  | "alerts"
  | "access-points"
  | "sensors"
  | "perimeter"
  | "building-labels";

export interface LayerDef { key: LayerKey; label: string; }

export const LAYER_DEFS: LayerDef[] = [
  { key: "cameras", label: "Cameras" },
  { key: "zones", label: "Zones" },
  { key: "alerts", label: "Alerts" },
  { key: "access-points", label: "Access Points" },
  { key: "sensors", label: "Sensors" },
  { key: "perimeter", label: "Perimeter" },
  { key: "building-labels", label: "Building Labels" },
];

export const ZONE_FILTER_OPTIONS = [
  { value: "all", label: "All Zones" },
  { value: "bldg-a", label: "Building A" },
  { value: "bldg-b", label: "Building B" },
  { value: "bldg-c", label: "Building C" },
  { value: "bldg-d", label: "Building D" },
  { value: "bldg-e", label: "Building E" },
  { value: "parking-a", label: "Parking Lot A" },
];
