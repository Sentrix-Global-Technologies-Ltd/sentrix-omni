import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { formatDateTime, humanize } from "../../../lib/format";
import type { ConsumerMediaAsset } from "../api/consumer-vision.types";

interface Props {
  asset: ConsumerMediaAsset | null;
  onClose: () => void;
}

/** Evidence detail — read-only, no manage-gated section (no permission for
 * it exists; see VisionGuardReviewer/vision-guard.consumer.view). */
export default function ConsumerMediaDetailModal({ asset, onClose }: Props) {
  if (!asset) return null;

  const isImage = asset.content_type?.startsWith("image/");
  const isVideo = asset.content_type?.startsWith("video/");

  return (
    <Modal isOpen onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{asset.user?.name ?? "Unknown user"}</h3>
      <p className="mt-1 text-theme-xs text-gray-400">{asset.user?.email ?? "—"}</p>

      {isImage && (
        <img src={asset.url} alt="Uploaded evidence" className="mt-4 max-h-64 w-full rounded-lg object-contain" />
      )}
      {isVideo && (
        <video src={asset.url} controls className="mt-4 max-h-64 w-full rounded-lg" />
      )}
      {!isImage && !isVideo && (
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-theme-sm font-medium text-brand-500 hover:underline"
        >
          View file
        </a>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-y-3 border-t border-gray-100 pt-4 text-theme-sm dark:border-gray-800">
        <dt className="text-gray-400">Ref</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300" title={asset.id}>
          {asset.id.slice(0, 8)}
        </dd>

        <dt className="text-gray-400">Source</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300">{asset.camera_source?.label ?? "—"}</dd>

        <dt className="text-gray-400">Content type</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300">{asset.content_type ?? "—"}</dd>

        <dt className="text-gray-400">Status</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300">{humanize(asset.status)}</dd>

        <dt className="text-gray-400">Linked to</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300">
          {asset.emergency_id ? `Emergency ${asset.emergency_id.slice(0, 8)}` : asset.trip_id ? `Trip ${asset.trip_id.slice(0, 8)}` : "—"}
        </dd>

        <dt className="text-gray-400">Captured</dt>
        <dd className="text-right text-gray-700 dark:text-gray-300">{formatDateTime(asset.captured_at)}</dd>
      </dl>

      <div className="mt-6 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
