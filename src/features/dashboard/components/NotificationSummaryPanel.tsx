import { Link } from "react-router";
import Button from "../../../components/ui/button/Button";
import NotificationsTable from "../../notifications/components/NotificationsTable";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { useNotificationMutations } from "../../notifications/hooks/useNotificationMutations";
import { useUnreadCount } from "../../notifications/hooks/useUnreadCount";

const card =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

/**
 * Notification summary — unread count + the most recent notifications, with
 * the same mark-read/remove actions as the full Notifications page. Stays
 * live through the notifications realtime hook mounted on the page.
 */
export default function NotificationSummaryPanel() {
  const unread = useUnreadCount();
  const query = useNotifications();
  const { markAsRead, markAllAsRead, remove } = useNotificationMutations();

  const recent = (query.data?.data ?? []).slice(0, 5);
  const hasUnread = (unread.data?.data?.count ?? 0) > 0;

  return (
    <div className={card}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Notifications</h3>
          {!unread.isLoading && (unread.data?.data?.count ?? 0) > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              {unread.data?.data?.count} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={!hasUnread || markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
          >
            Mark all read
          </Button>
          <Link to="/notifications" className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
            View all
          </Link>
        </div>
      </div>
      <NotificationsTable
        notifications={recent}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onMarkRead={(id) => markAsRead.mutate(id)}
        onDelete={(id) => remove.mutateAsync(id)}
        busy={markAsRead.isPending}
      />
    </div>
  );
}
