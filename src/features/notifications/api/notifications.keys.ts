/** Query keys for notifications (user-scoped, not org-scoped). */
export const notificationKeys = {
  all: () => ["notifications"] as const,
  list: (cursor?: string) => ["notifications", "list", cursor ?? "first"] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};
