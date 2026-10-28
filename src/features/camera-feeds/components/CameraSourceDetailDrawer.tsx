import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../../../icons";
import Can from "../../../components/shared/Can";
import type { CameraSource } from "../api/camera-feeds.types";
import { CAMERA_SOURCE_TYPES } from "./cameraSourceTypeMeta";
import { feedStatusLabel, feedStatusTone, relativeTime } from "./feedStatusTone";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";

/** Types where the connection URL may contain embedded credentials. */
const CREDENTIAL_TYPES = new Set(["ip_camera", "rtsp", "cctv", "external_cctv"]);

/**
 * Masks embedded credentials in a connection URL.
 * "rtsp://user:pass@192.168.1.10/stream" → "rtsp://••••@192.168.1.10/stream"
 * Non-credential URLs are returned as-is.
 */
function maskConnectionUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      parsed.username = "••••";
      parsed.password = "";
      return parsed.toString();
    }
  } catch {
    // Not a parseable URL — return as-is without credentials exposed
  }
  return url;
}

const STATUS_DOT_COLOR: Record<string, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error:   "#ef4444",
  light:   "#9ca3af",
};

function FeedStatusBadge({ feedStatus }: { feedStatus: CameraSource["feed_status"] }) {
  const tone = feedStatusTone(feedStatus);
  const label = feedStatusLabel(feedStatus);
  const color = STATUS_DOT_COLOR[tone] ?? STATUS_DOT_COLOR.light;
  const textClass =
    tone === "success" ? "text-green-700 dark:text-green-400"
    : tone === "warning" ? "text-amber-700 dark:text-amber-400"
    : tone === "error"   ? "text-red-700 dark:text-red-400"
    : "text-gray-400";
  const bgClass =
    tone === "success" ? "bg-green-50 dark:bg-green-500/10"
    : tone === "warning" ? "bg-amber-50 dark:bg-amber-500/10"
    : tone === "error"   ? "bg-red-50 dark:bg-red-500/10"
    : "bg-gray-100 dark:bg-white/5";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bgClass} ${textClass}`}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function HealthBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">No data</span>;
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Warning" : "Critical";
  const barClass =
    score >= 80 ? "bg-green-500"
    : score >= 60 ? "bg-amber-500"
    : "bg-red-500";
  const textClass =
    score >= 80 ? "text-green-700 dark:text-green-400"
    : score >= 60 ? "text-amber-700 dark:text-amber-400"
    : "text-red-700 dark:text-red-400";
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full ${barClass}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-xs font-medium ${textClass}`}>{score}% — {label}</span>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-sm text-gray-800 dark:text-white/90">{children}</div>
    </div>
  );
}

interface Props {
  /** Source to display; null means closed. */
  source: CameraSource | null;
  onClose: () => void;
  /** Called when the authorized user chooses to edit this source. */
  onEdit?: (source: CameraSource) => void;
}

/**
 * "View Camera Source" — read-only right-side slide-in drawer.
 * Displays all safe fields from the already-fetched CameraSource row.
 * No additional API call is needed — all data is available from the list.
 *
 * Uses cs-drawer-* CSS classes (imported by CameraSourcesPage via camera-sources.css).
 * Connection URLs are masked for credential-bearing types.
 */
export default function CameraSourceDetailDrawer({ source, onClose, onEdit }: Props) {
  const open = source !== null;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Called unconditionally (hook rules): source?.x is null-safe when drawer is closed.
  const { src: frameSrc, status: frameStatus } = useAuthenticatedImage(
    source?.last_frame_url,
    source?.last_frame_at,
  );

  if (!open || !source) return null;

  const typeMeta = CAMERA_SOURCE_TYPES.find((t) => t.value === source.type);
  const showConnectionUrl = !!source.connection_url;
  const connectionDisplay = showConnectionUrl
    ? (CREDENTIAL_TYPES.has(source.type)
        ? maskConnectionUrl(source.connection_url!)
        : source.connection_url!)
    : null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="cs-drawer-backdrop"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="cs-drawer"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-label="Camera Source Details"
      >
        {/* Header */}
        <div className="cs-drawer-header">
          <span className="cs-drawer-title">Camera Source Details</span>
          <button className="cs-drawer-close" onClick={onClose} aria-label="Close">
            <CloseIcon className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="cs-drawer-body">
          {/* Type + label hero */}
          {typeMeta && (
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                {typeMeta.icon}
              </span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">{source.label}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{typeMeta.label}</p>
              </div>
            </div>
          )}

          {/* Last frame thumbnail (if available) — fetched with bearer token */}
          {source.last_frame_url && (
            <div className="mb-5">
              {frameSrc ? (
                <img
                  src={frameSrc}
                  alt="Latest camera frame"
                  className="w-full rounded-xl object-cover max-h-44 bg-gray-100 dark:bg-gray-800"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">
                    {frameStatus === "error" ? "Frame unavailable" : "Loading…"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Detail rows */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <DetailRow label="Feed status">
              <FeedStatusBadge feedStatus={source.feed_status} />
            </DetailRow>

            <DetailRow label="Health score">
              <HealthBar score={source.health_score} />
            </DetailRow>

            <DetailRow label="Site / Building">
              {source.site ? (
                <span>{source.site}{source.zone ? ` — ${source.zone}` : ""}</span>
              ) : (
                <span className="text-gray-400">Not set</span>
              )}
            </DetailRow>

            <DetailRow label="Activation status">
              <span className={source.status === "active"
                ? "text-green-700 dark:text-green-400"
                : "text-gray-400"}>
                {source.status === "active" ? "Active" : "Inactive"}
              </span>
            </DetailRow>

            {showConnectionUrl && connectionDisplay && (
              <DetailRow label="Connection URL">
                <code className="block break-all text-xs font-mono text-gray-600 dark:text-gray-300">
                  {connectionDisplay}
                </code>
                {CREDENTIAL_TYPES.has(source.type) && (
                  <p className="mt-1 text-xs text-gray-400">Credentials masked for security</p>
                )}
              </DetailRow>
            )}

            {source.tags && source.tags.length > 0 && (
              <DetailRow label="Tags">
                <span className="flex flex-wrap gap-1.5">
                  {source.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/8 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </DetailRow>
            )}

            {source.last_frame_at && (
              <DetailRow label="Last frame received">
                <span title={source.last_frame_at}>
                  {relativeTime(source.last_frame_at)}
                </span>
              </DetailRow>
            )}

            {source.created_at && (
              <DetailRow label="Added">
                <span title={source.created_at}>
                  {relativeTime(source.created_at)}
                </span>
              </DetailRow>
            )}

            <DetailRow label="Source ID">
              <code className="text-xs font-mono text-gray-400">{source.id}</code>
            </DetailRow>
          </div>
        </div>

        {/* Footer — Edit (authorized) + Close */}
        <div className="cs-drawer-footer flex gap-2">
          <Can permission="camera-sources.manage">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(source!)}
                className="flex-1 rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
            )}
          </Can>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
