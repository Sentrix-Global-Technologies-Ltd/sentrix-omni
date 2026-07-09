import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { notificationsApi } from "../api/notifications.api";
import { notificationKeys } from "../api/notifications.keys";

/** Unread notification count for the header badge. */
export function useUnreadCount() {
  const { principal } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    enabled: Boolean(principal),
  });
}
