import StatusBadge from "../../../components/ui/badge/StatusBadge";
import { useAuthenticatedImage } from "../../../hooks/useAuthenticatedImage";
import { feedStatusLabel, feedStatusTone, relativeTime } from "./feedStatusTone";
import type { CameraSource } from "../api/camera-feeds.types";

interface Props {
  source: CameraSource;
}

/** One camera tile: latest pushed snapshot (auto-refreshing via the parent's
 * poll), feed-status badge, and where it's mounted. The frame is private: it
 * is fetched with the bearer token (useAuthenticatedImage) and re-fetched
 * whenever last_frame_at changes, i.e. when a fresher frame lands. */
export default function CameraFeedCard({ source }: Props) {
  const { src, status } = useAuthenticatedImage(source.last_frame_url, source.last_frame_at);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex aspect-video items-center justify-center bg-gray-100 dark:bg-white/5">
        {src ? (
          <img src={src} alt={source.label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-theme-xs text-gray-400">
            {!source.last_frame_url ? "No feed yet" : status === "error" ? "Frame unavailable" : "Loading…"}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">{source.label}</p>
          <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {[source.site, source.zone].filter(Boolean).join(" · ") || "No site/zone set"}
          </p>
          {source.last_frame_at && (
            <p className="mt-0.5 text-theme-xs text-gray-400">Updated {relativeTime(source.last_frame_at)}</p>
          )}
        </div>
        <StatusBadge tone={feedStatusTone(source.feed_status)}>{feedStatusLabel(source.feed_status)}</StatusBadge>
      </div>
    </div>
  );
}
