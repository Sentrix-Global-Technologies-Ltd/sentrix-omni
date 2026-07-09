/** Notification types — mirror the backend DatabaseNotification resource. */

export interface AppNotification {
  id: string;
  type: string;
  /** Arbitrary notification payload (title/message/links live here). */
  payload: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string | null;
}
