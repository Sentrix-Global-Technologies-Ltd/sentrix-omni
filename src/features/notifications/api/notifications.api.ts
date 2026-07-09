import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { AppNotification } from "./notifications.types";

/** Notifications are user-scoped (no organization segment). */
export const notificationsApi = {
  list(cursor?: string): Promise<ApiResult<AppNotification[]>> {
    return apiClient.get<AppNotification[]>("notifications", { query: { cursor } });
  },

  markAsRead(id: string): Promise<ApiResult<AppNotification | null>> {
    return apiClient.post<AppNotification | null>(`notifications/${id}/read`);
  },

  markAllAsRead(): Promise<ApiResult<null>> {
    return apiClient.post<null>("notifications/read-all");
  },

  remove(id: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`notifications/${id}`);
  },

  unreadCount(): Promise<ApiResult<{ count: number }>> {
    return apiClient.get<{ count: number }>("notifications/unread-count");
  },
};
