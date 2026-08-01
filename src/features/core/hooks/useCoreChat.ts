import { useRef, useState } from "react";
import { useOrganization } from "../../../context/OrganizationContext";
import { streamChat } from "../api/chatStream";
import type { ChatThreadDetail } from "../api/core.api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

/**
 * Streaming chat session against the Core bridge (SSE), now backed by
 * persisted history: `threadId` starts null (a fresh, not-yet-saved
 * conversation) and is set from the backend's response the moment the first
 * message creates a thread — every subsequent `send()` continues that same
 * thread. `reset()`/`openThread()` are the only two ways `threadId` changes
 * after that, matching the "New chat" / history-list affordances in
 * AssistantPage.tsx.
 */
export function useCoreChat() {
  const { activeId } = useOrganization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setError(null);

    const assistantId = nextId();
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", content },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamChat({
        message: content,
        organizationId: activeId,
        threadId,
        signal: ctrl.signal,
        onThreadId: (id) => setThreadId(id),
        onToken: (t) =>
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: x.content + t } : x))),
      });
    } catch (e) {
      const aborted = (e as Error).name === "AbortError";
      if (!aborted) setError("The assistant is unavailable right now.");
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId && x.content === ""
            ? { ...x, content: aborted ? "(stopped)" : "(no response)" }
            : x,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  /** Start a genuinely new, not-yet-persisted conversation. */
  const reset = () => {
    stop();
    setMessages([]);
    setThreadId(null);
    setError(null);
  };

  /** Load a past thread from the history list into the active transcript. */
  const openThread = (thread: ChatThreadDetail) => {
    stop();
    setThreadId(thread.id);
    setMessages(thread.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })));
    setError(null);
  };

  return { messages, streaming, error, threadId, send, stop, reset, openThread };
}
