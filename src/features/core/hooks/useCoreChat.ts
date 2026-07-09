import { useRef, useState } from "react";
import { useOrganization } from "../../../context/OrganizationContext";
import { streamChat } from "../api/chatStream";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

/** Streaming chat session against the Core bridge (SSE). */
export function useCoreChat() {
  const { activeId } = useOrganization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        signal: ctrl.signal,
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
  const reset = () => {
    stop();
    setMessages([]);
    setError(null);
  };

  return { messages, streaming, error, send, stop, reset };
}
