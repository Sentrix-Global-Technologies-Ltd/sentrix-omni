import { Link } from "react-router";
import { useCameraFeeds } from "../../camera-feeds/hooks/useCameraFeeds";
import CameraFeedGrid from "../../camera-feeds/components/CameraFeedGrid";
import { useRecentDetections } from "../../detections/hooks/useDetections";
import DetectionList from "../../detections/components/DetectionList";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Camera Wall — camera health tiles (reusing the Live Feeds grid, capped to a
 * handful) + a plain-text recent-detections list. Deliberately no
 * bounding-box overlay: detections aren't tied to stored frame coordinates,
 * so a text line per event is the honest representation of what the data
 * supports. Both halves reuse existing hooks/components rather than
 * introducing new visual primitives.
 */
export default function CameraWallPanel() {
  const feeds = useCameraFeeds({});
  const detections = useRecentDetections({ limit: 8 });

  const tiles = (feeds.data?.data ?? []).slice(0, 6);
  const recent = detections.data?.data ?? [];

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Camera wall</h3>
        <Link to="/hardware" className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
          View all
        </Link>
      </div>

      <CameraFeedGrid
        sources={tiles}
        isLoading={feeds.isLoading}
        error={feeds.error}
        onRetry={() => void feeds.refetch()}
      />

      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h4 className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
          Recent detections
        </h4>
        <DetectionList
          detections={recent}
          isLoading={detections.isLoading}
          error={detections.error}
          onRetry={() => void detections.refetch()}
        />
      </div>
    </div>
  );
}
