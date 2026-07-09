import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";
import { notificationKeys } from "../api/notifications.keys";

/** Cursor-paginated notifications for the current user (undefined = first page). */
export function useNotifications(cursor?: string) {
  return useQuery({
    queryKey: notificationKeys.list(cursor),
    queryFn: () => notificationsApi.list(cursor),
    placeholderData: keepPreviousData,
  });
}
