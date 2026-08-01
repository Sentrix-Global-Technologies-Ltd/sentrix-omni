import type { ReactNode } from "react";
import {
  BoltIcon,
  BoxCubeIcon,
  EyeIcon,
  FolderIcon,
  PageIcon,
  PlugInIcon,
  UserCircleIcon,
  VideoIcon,
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
 * reference design. Kept in one place so the modal and the table's type
 * badges never drift from each other. */
export const CAMERA_SOURCE_TYPES: CameraSourceTypeMeta[] = [
  {
    value: "ip_camera",
    label: "IP Camera",
    description: "Add an IP camera via direct network connection.",
    icon: <VideoIcon className={iconClass} />,
    requiresConnectionUrl: true,
  },
  {
    value: "cctv",
    label: "CCTV / Analog Camera",
    description: "Add a traditional CCTV or analog camera.",
    icon: <BoxCubeIcon className={iconClass} />,
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
    icon: <FolderIcon className={iconClass} />,
    requiresConnectionUrl: false,
  },
  {
    value: "external_cctv",
    label: "External CCTV System",
    description: "Integrate with an external CCTV system.",
    icon: <PageIcon className={iconClass} />,
    requiresConnectionUrl: true,
  },
];

export function cameraSourceTypeMeta(type: string): CameraSourceTypeMeta | undefined {
  return CAMERA_SOURCE_TYPES.find((t) => t.value === type);
}

export function cameraSourceTypeLabel(type: string): string {
  return cameraSourceTypeMeta(type)?.label ?? type;
}
