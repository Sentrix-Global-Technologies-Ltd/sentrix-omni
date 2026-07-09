import LoadingState from "../../../components/ui/state/LoadingState";
import ErrorState from "../../../components/ui/state/ErrorState";
import EmptyState from "../../../components/ui/state/EmptyState";
import CameraFeedCard from "./CameraFeedCard";
import type { CameraSource } from "../api/camera-feeds.types";

interface Props {
  sources: CameraSource[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/** Grid layout instead of DataTable — a snapshot tile isn't tabular data,
 * same reasoning UnitCommsPanel used for its two-pane layout. */
export default function CameraFeedGrid({ sources, isLoading, error, onRetry }: Props) {
  const hasError = error !== null && error !== undefined;

  if (isLoading) return <LoadingState label="Loading camera feeds…" />;
  if (hasError) return <ErrorState error={error} onRetry={onRetry} />;
  if (sources.length === 0) {
    return (
      <EmptyState
        title="No camera feeds yet"
        description="Once a Site Bridge (or an org's own NVR pushing directly) registers a camera source, its live snapshot appears here."
      />
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {sources.map((source) => (
        <div key={source.id} className="col-span-12 sm:col-span-6 xl:col-span-4">
          <CameraFeedCard source={source} />
        </div>
      ))}
    </div>
  );
}
