import { useSearchParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import CursorPagination, { type CursorMeta } from "../../../components/ui/pagination/CursorPagination";
import Button from "../../../components/ui/button/Button";
import NotificationsTable from "../components/NotificationsTable";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationMutations } from "../hooks/useNotificationMutations";

export default function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const cursor = params.get("cursor") ?? undefined;

  const query = useNotifications(cursor);
  const { markAsRead, markAllAsRead, remove } = useNotificationMutations();

  const setCursor = (c: string | null) => {
    const sp = new URLSearchParams();
    if (c) sp.set("cursor", c);
    setParams(sp);
  };

  const notifications = query.data?.data ?? [];
  const meta = query.data?.meta as CursorMeta | undefined;
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      <PageMeta title="Notifications | Sentrix Console" description="Your notifications" />
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={!hasUnread || markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
          >
            Mark all read
          </Button>
        }
      />

      <NotificationsTable
        notifications={notifications}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        onMarkRead={(id) => markAsRead.mutate(id)}
        onDelete={(id) => remove.mutateAsync(id)}
        busy={markAsRead.isPending}
      />

      <CursorPagination meta={meta} onCursor={setCursor} />
    </>
  );
}
