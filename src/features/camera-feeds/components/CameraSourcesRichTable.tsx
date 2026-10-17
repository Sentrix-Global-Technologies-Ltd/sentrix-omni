import { useRef, useState, useEffect, useMemo } from "react";
import DataTable, { type Column } from "../../../components/ui/table/DataTable";
import type { CameraSource } from "../api/camera-feeds.types";
import { feedStatusLabel, feedStatusTone, relativeTime } from "./feedStatusTone";
import CameraSourceTypeBadge from "./CameraSourceTypeBadge";
import CameraConnectionIndicator from "./CameraConnectionIndicator";
import CameraHealthRing from "./CameraHealthRing";

interface Props {
  sources: CameraSource[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onDelete?: (source: CameraSource) => void;
  onEdit?: (source: CameraSource) => void;
}

// ── Status dot colours ──────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  error:   "#ef4444",
  light:   "#9ca3af",
};

function StatusDot({ feedStatus }: { feedStatus: CameraSource["feed_status"] }) {
  const tone = feedStatusTone(feedStatus);
  // Map feed_status labels to friendlier display names
  const display =
    feedStatus === "live"    ? "Online"
    : feedStatus === "stale"   ? "Stale"
    : feedStatus === "offline" ? "Offline"
    : "No feed";
  const color = STATUS_DOT[tone] ?? STATUS_DOT.light;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className={`font-medium ${tone === "success" ? "text-green-600 dark:text-green-400" : tone === "warning" ? "text-amber-600 dark:text-amber-400" : tone === "error" ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}>
        {display}
      </span>
    </span>
  );
}

// ── Frame thumbnail ─────────────────────────────────────────────────────────
function FrameThumb({ url }: { url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Camera frame"
        className="h-10 w-16 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-800"
      />
    );
  }
  return (
    <div className="h-10 w-16 rounded flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Health ring with label ──────────────────────────────────────────────────
function HealthCell({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="text-xs text-gray-400">N/A</span>
    );
  }
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Warning" : "Critical";
  const labelColor =
    score >= 80 ? "text-green-600 dark:text-green-400"
    : score >= 60 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <CameraHealthRing score={score} />
      <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
    </span>
  );
}

// ── Tags chips ──────────────────────────────────────────────────────────────
const MAX_TAGS = 2;
function TagsCell({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return <span className="text-xs text-gray-400">—</span>;
  const visible = tags.slice(0, MAX_TAGS);
  const extra = tags.length - MAX_TAGS;
  return (
    <span className="flex flex-wrap gap-1">
      {visible.map((t) => (
        <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/8 dark:text-gray-300">
          {t}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-white/8 dark:text-gray-400">
          +{extra}
        </span>
      )}
    </span>
  );
}

// ── Three-dots row actions menu ─────────────────────────────────────────────
interface RowMenuProps {
  source: CameraSource;
  onEdit?: (s: CameraSource) => void;
  onDelete?: (s: CameraSource) => void;
}

function RowActionsMenu({ source, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-white/70 transition-colors"
        title="Actions"
      >
        {/* Three vertical dots */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 50,
            minWidth: 160,
          }}
          className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5 rounded-t-xl transition-colors"
          >
            View source
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(source); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
            >
              Edit details
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
          >
            Mark for review
          </button>
          {onDelete && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                type="button"
                onClick={() => { setOpen(false); onDelete(source); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-b-xl transition-colors"
              >
                Remove source
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main table component ────────────────────────────────────────────────────
/**
 * Enhanced camera sources table — for the Camera Sources management page only.
 * Adds thumbnail, IP address, Source Type badge, Site/Location, Status dot,
 * Connection signal, Health ring + label, Tags chips, and a three-dots action
 * menu with "View source / Edit details / Mark for review / Remove".
 *
 * CameraSourcesTable is left untouched — HardwareConsolePage uses it.
 */
export default function CameraSourcesRichTable({
  sources,
  isLoading,
  error,
  onRetry,
  onDelete,
  onEdit,
}: Props) {
  const columns: Column<CameraSource>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Source Name",
        render: (s) => (
          <div className="flex items-center gap-3">
            <FrameThumb url={s.last_frame_url} />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-white/90 truncate">{s.label}</p>
              {s.connection_url && (
                <p className="mt-0.5 text-xs text-gray-400 truncate max-w-[180px]" title={s.connection_url}>
                  {s.connection_url}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Source Type",
        render: (s) => <CameraSourceTypeBadge type={s.type} />,
      },
      {
        key: "site",
        header: "Site / Location",
        render: (s) => (
          s.site ? (
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200">{s.site}</p>
              {s.zone && <p className="text-xs text-gray-400">{s.zone}</p>}
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (s) => <StatusDot feedStatus={s.feed_status} />,
      },
      {
        key: "connection",
        header: "Connection ✦",
        headerClassName: "whitespace-nowrap",
        render: (s) => (
          <CameraConnectionIndicator
            feedStatus={s.feed_status}
            healthScore={s.health_score}
          />
        ),
      },
      {
        key: "health",
        header: "Health",
        render: (s) => <HealthCell score={s.health_score} />,
      },
      {
        key: "tags",
        header: "Tags",
        render: (s) => <TagsCell tags={s.tags} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-10",
        render: (s) => (
          <RowActionsMenu source={s} onEdit={onEdit} onDelete={onDelete} />
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <DataTable<CameraSource>
      columns={columns}
      rows={sources}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No camera sources"
      emptyDescription="Add your first camera source to start monitoring."
    />
  );
}
