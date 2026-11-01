import type { ReactNode } from "react";
import {
  BoltIcon,
  CameraIcon,
  DownloadIcon,
  EyeIcon,
  GridIcon,
  PlugInIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "../../../icons";
import type { OrgCameraSourceType } from "../api/camera-feeds.types";

export interface CameraSourceTypeMeta {
  value: OrgCameraSourceType;
  label: string;
  description: string;
  icon: ReactNode;
  /** Mirrors SourceType::requiresConnectionUrl() on the backend. */
  requiresConnectionUrl: boolean;
}

const iconClass = "size-5";

/** The 8 types offered by "Add Camera Source" — order and copy mirror the
 * reference design. Kept in one place so the drawer and the table's type
 * badges never drift from each other. */
export const CAMERA_SOURCE_TYPES: CameraSourceTypeMeta[] = [
  {
    value: "ip_camera",
    label: "IP Camera",
    description: "Add an IP camera via direct network connection.",
    icon: <CameraIcon className={iconClass} />,
    requiresConnectionUrl: true,
  },
  {
    value: "cctv",
    label: "CCTV / Analog Camera",
    description: "Add a traditional CCTV or analog camera.",
    icon: <ShieldCheckIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "rtsp",
    label: "RTSP Stream",
    description: "Add a camera using an RTSP stream URL.",
    icon: <PlugInIcon className={iconClass} />,
    requiresConnectionUrl: true,
  },
  {
    value: "phone",
    label: "Mobile Camera",
    description: "Connect a mobile device camera.",
    icon: <UserCircleIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "dashcam",
    label: "Dashcam",
    description: "Add a vehicle dashcam for monitoring.",
    icon: <BoltIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "smart_glasses",
    label: "Smart Glasses",
    description: "Connect smart glasses for live streaming.",
    icon: <EyeIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "upload",
    label: "Uploaded Video",
    description: "Upload video files for review and analysis.",
    icon: <DownloadIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "external_cctv",
    label: "External CCTV System",
    description: "Integrate with an external CCTV system.",
    icon: <GridIcon className={iconClass} />,
    requiresConnectionUrl: true,
  },
];

export function cameraSourceTypeMeta(type: string): CameraSourceTypeMeta | undefined {
  return CAMERA_SOURCE_TYPES.find((t) => t.value === type);
}

export function cameraSourceTypeLabel(type: string): string {
  return cameraSourceTypeMeta(type)?.label ?? type;
}

// --- Icon colour used inside the drawer picker (circle bg + icon fg) -------
export type TypeTone = "teal" | "blue" | "purple" | "green" | "orange" | "dark-green" | "mid-blue" | "red";

export const TYPE_TONE: Record<OrgCameraSourceType, TypeTone> = {
  ip_camera:     "teal",
  cctv:          "blue",
  rtsp:          "purple",
  phone:         "green",
  dashcam:       "orange",
  smart_glasses: "dark-green",
  upload:        "mid-blue",
  external_cctv: "red",
};

export const DOT_COLOR: Record<OrgCameraSourceType, string> = {
  ip_camera:     "#0d9488", // teal-600
  cctv:          "#2563eb", // blue-600
  rtsp:          "#7c3aed", // violet-600
  phone:         "#16a34a", // green-600
  dashcam:       "#ea580c", // orange-600
  smart_glasses: "#15803d", // green-700
  upload:        "#1d4ed8", // blue-700
  external_cctv: "#dc2626", // red-600
};
