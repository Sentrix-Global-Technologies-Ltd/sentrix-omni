import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface PlatformSnapshot {
  open_incidents_by_severity: Record<string, number>;
  open_incidents_total: number;
  active_emergencies: number;
  on_duty_responders: number;
}

/** Result of a confirmed Core tool action (fail-safe: `ok:false` when offline). */
export interface CoreActResult {
  ok?: boolean;
  message?: string;
  _simulated?: boolean;
  [key: string]: unknown;
}

export interface ChatMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

/** List-view shape (`GET core/threads`) — no `messages`, kept lightweight so
 *  the history list never pulls full transcripts just to render titles. */
export interface ChatThreadSummary {
  id: string;
  title: string | null;
  organization_id: string | null;
  archived_at: string | null;
  last_message_at: string | null;
  created_at: string | null;
}

/** Detail shape (`GET core/threads/{id}`) — same fields, plus the transcript. */
export interface ChatThreadDetail extends ChatThreadSummary {
  messages: ChatMessageRecord[];
}

/** SentrixCore bridge — platform-wide (SuperAdmin) snapshot + tool actions,
 *  plus each user's own persisted chat history (private — see ChatThread's
 *  backend docblock). */
export const coreApi = {
  platformSnapshot(): Promise<ApiResult<PlatformSnapshot>> {
    return apiClient.get<PlatformSnapshot>("core/platform-snapshot");
  },
  /** Execute a confirmed Core tool action. Body schema is defined by Core. */
  act(body: Record<string, unknown>): Promise<ApiResult<CoreActResult>> {
    return apiClient.post<CoreActResult>("core/act", body);
  },
  /** The caller's own conversations, newest first. Archived ones excluded
   *  unless `includeArchived` — archiving hides a thread, it never deletes it. */
  listThreads(includeArchived = false): Promise<ApiResult<ChatThreadSummary[]>> {
    return apiClient.get<ChatThreadSummary[]>("core/threads", {
      query: includeArchived ? { archived: 1 } : undefined,
    });
  },
  getThread(threadId: string): Promise<ApiResult<ChatThreadDetail>> {
    return apiClient.get<ChatThreadDetail>(`core/threads/${threadId}`);
  },
  /** Soft-hide from the caller's own list. Never a hard delete. */
  archiveThread(threadId: string): Promise<ApiResult<ChatThreadSummary>> {
    return apiClient.post<ChatThreadSummary>(`core/threads/${threadId}/archive`);
  },
};
