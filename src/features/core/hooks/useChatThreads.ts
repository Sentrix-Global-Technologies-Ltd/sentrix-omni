import { useCallback, useState } from "react";
import { coreApi, type ChatThreadDetail, type ChatThreadSummary } from "../api/core.api";

/**
 * Backs the compact "History" list in AssistantPage.tsx. Deliberately
 * separate from useCoreChat (the active conversation) — this only manages
 * the list itself (fetch-on-open, archive), keeping each hook single-purpose.
 */
export function useChatThreads() {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await coreApi.listThreads();
      setThreads(data);
    } catch {
      setError("Couldn't load your chat history.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openThread = useCallback(async (threadId: string): Promise<ChatThreadDetail | null> => {
    try {
      const { data } = await coreApi.getThread(threadId);
      return data;
    } catch {
      setError("Couldn't open that conversation.");
      return null;
    }
  }, []);

  const archiveThread = useCallback(async (threadId: string) => {
    try {
      await coreApi.archiveThread(threadId);
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch {
      setError("Couldn't remove that conversation.");
    }
  }, []);

  return { threads, loading, error, refresh, openThread, archiveThread };
}
