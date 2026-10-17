import type { OrgCameraSourceType } from "../api/camera-feeds.types";
import { cameraSourceTypeLabel, DOT_COLOR } from "./cameraSourceTypeMeta";

interface Props {
  type: string;
}

const BG: Record<OrgCameraSourceType, string> = {
  ip_camera:     "bg-teal-50  text-teal-700  dark:bg-teal-500/10  dark:text-teal-300",
  cctv:          "bg-blue-50  text-blue-700  dark:bg-blue-500/10  dark:text-blue-300",
  rtsp:          "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  phone:         "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  dashcam:       "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  smart_glasses: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  upload:        "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  external_cctv: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

const FALLBACK = "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300";

/**
 * Coloured pill badge for a camera source type.
 * Shows a small filled circle in the type's brand colour followed by the label.
 */
export default function CameraSourceTypeBadge({ type }: Props) {
  const key = type as OrgCameraSourceType;
  const bg = key in BG ? BG[key] : FALLBACK;
  const dot = key in DOT_COLOR ? DOT_COLOR[key] : "#6b7280";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${bg}`}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }}
      />
      {cameraSourceTypeLabel(type)}
    </span>
  );
}
