import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import StatusBadge from "../../../components/ui/badge/StatusBadge";
import Can from "../../../components/shared/Can";
import { useToast } from "../../../components/shared/toast";
import { communityStatusTone, formatDateTime } from "./communityTone";
import { useCommunityComments } from "../hooks/useCommunityAlerts";
import { useDeleteCommunityComment, useResolveCommunityAlert } from "../hooks/useCommunityModeration";
import type { PlatformCommunityAlert } from "../api/community.types";

interface Props {
  alert: PlatformCommunityAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full detail of a community report for a moderator: real reporter identity
 * (even behind an anonymous report — see PlatformCommunityAlertResource),
 * photo/video evidence, and the discussion thread with per-comment removal.
 * Resolve/delete-comment are gated on community.manage; the rest of the
 * modal is visible to anyone who reached the page via community.view.
 */
export default function CommunityAlertDetailModal({ alert, isOpen, onClose }: Props) {
  const toast = useToast();
  const comments = useCommunityComments(isOpen ? alert?.id ?? null : null);
  const resolve = useResolveCommunityAlert();
  const deleteComment = useDeleteCommunityComment();

  if (!isOpen || !alert) return null;

  const runResolve = async () => {
    if (!window.confirm(`Remove "${alert.title}" from the active feed?`)) return;
    try {
      await resolve.mutateAsync(alert.id);
      toast.success("Report resolved and removed from the feed.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resolve this report.");
    }
  };

  const runDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment.mutateAsync({ alertId: alert.id, commentId });
      toast.success("Comment removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete this comment.");
    }
  };

  return (
    <Modal isOpen onClose={onClose} showCloseButton className="mx-4 w-full max-w-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{alert.title}</h3>
          <p className="mt-1 text-theme-xs text-gray-400 capitalize">
            {alert.category} · {alert.source}
          </p>
        </div>
        <StatusBadge tone={communityStatusTone(alert.status)}>{alert.status}</StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-theme-sm dark:border-gray-800">
        <div>
          <p className="text-gray-400">Reporter</p>
          <p className="mt-0.5 text-gray-700 dark:text-gray-300">{alert.reporter_name ?? "Unknown"}</p>
          {alert.reporter_email && <p className="text-theme-xs text-gray-400">{alert.reporter_email}</p>}
          {alert.is_anonymous && (
            <p className="mt-1 text-theme-xs text-warning-500">
              Reported anonymously — hidden from other users, visible here for moderation only.
            </p>
          )}
        </div>
        <div>
          <p className="text-gray-400">Reported</p>
          <p className="mt-0.5 text-gray-700 dark:text-gray-300">{formatDateTime(alert.created_at)}</p>
        </div>
      </div>

      {alert.note && (
        <div className="mt-4">
          <p className="text-theme-sm text-gray-400">Details</p>
          <p className="mt-1 text-theme-sm text-gray-700 dark:text-gray-300">{alert.note}</p>
        </div>
      )}

      {(alert.photo_url || alert.video_url) && (
        <div className="mt-4 flex gap-3">
          {alert.photo_url && (
            <a href={alert.photo_url} target="_blank" rel="noreferrer" className="text-theme-sm font-medium text-brand-500 hover:underline">
              View photo evidence →
            </a>
          )}
          {alert.video_url && (
            <a href={alert.video_url} target="_blank" rel="noreferrer" className="text-theme-sm font-medium text-brand-500 hover:underline">
              View video evidence →
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-4 text-theme-xs text-gray-400">
        <span>{alert.likes_count} likes</span>
        <span>{alert.helpful_count} helpful</span>
        <span>{alert.confirmations_count} confirmations</span>
        <span>{alert.dismissals_count} dismissals</span>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          Comments{alert.comments_count ? ` (${alert.comments_count})` : ""}
        </p>

        {comments.isLoading && <p className="mt-2 text-theme-xs text-gray-400">Loading comments…</p>}
        {!comments.isLoading && (comments.data?.data ?? []).length === 0 && (
          <p className="mt-2 text-theme-xs text-gray-400">No comments on this report.</p>
        )}

        <div className="mt-2 space-y-3">
          {(comments.data?.data ?? []).map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
              <div>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{c.author_name}</p>
                <p className="text-theme-sm text-gray-600 dark:text-gray-300">{c.body}</p>
                <p className="mt-0.5 text-theme-xs text-gray-400">{formatDateTime(c.created_at)}</p>
              </div>
              <Can permission="community.manage">
                <button
                  onClick={() => void runDeleteComment(c.id)}
                  className="text-theme-xs font-medium text-error-500 hover:underline"
                >
                  Remove
                </button>
              </Can>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Can permission="community.manage">
          {alert.status !== "resolved" && (
            <Button size="sm" variant="primary" onClick={() => void runResolve()} disabled={resolve.isPending}>
              {resolve.isPending ? "Resolving…" : "Resolve / remove from feed"}
            </Button>
          )}
        </Can>
      </div>
    </Modal>
  );
}
