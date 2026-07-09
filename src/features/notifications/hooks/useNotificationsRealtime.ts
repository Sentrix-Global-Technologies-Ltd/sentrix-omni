import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { useOrgChannel } from "../../../realtime/useOrgChannel";
import { notificationKeys } from "../api/notifications.keys";

// Laravel broadcasts database notifications on the user's private channel
// `App.Models.User.{id}` with this event class name. A couple of name variants
// are listed for resilience across broadcaster configs.
const NOTIFICATION_EVENTS = [
  "Illuminate\\Notifications\\Events\\BroadcastNotificationCreated",
  "BroadcastNotificationCreated",
];

/**
 * Personal-channel realtime: refresh the notification list + unread count when a
 * new notification is broadcast. Returns `{ connected }`. No-op when realtime is
 * off or before the principal is known.
 */
export function useNotificationsRealtime(): { connected: boolean } {
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  return useOrgChannel(
    principal?.id ? `App.Models.User.${principal.id}` : null,
    NOTIFICATION_EVENTS,
    () => queryClient.invalidateQueries({ queryKey: notificationKeys.all() }),
  );
}
