import { env } from "../../../config/env";
import { tokenStorage } from "../../../services/api/tokenStorage";

interface StreamChatOptions {
  message: string;
  organizationId: string | null;
  signal: AbortSignal;
  /** Called for each streamed text token. */
  onToken: (text: string) => void;
}

/**
 * Stream a chat turn from `POST /core/chat`.
 *
 * The endpoint returns Server-Sent Events: `data: {"text": "..."}` chunks,
 * terminated by `data: [DONE]`. It is fail-safe on the backend (Core offline →
 * a valid offline SSE), so this always streams *something*; network/abort errors
 * still reject so the caller can surface them.
 *
 * Uses a raw fetch (not the JSON apiClient) because the body is a stream, but it
 * mirrors the client's auth: sessionStorage bearer token + the active-org header.
 */
export async function streamChat({ message, organizationId, signal, onToken }: StreamChatOptions): Promise<void> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (organizationId) headers["X-Organization"] = organizationId;

  const response = await fetch(`${env.apiBaseUrl}/core/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, organization_id: organizationId }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const eventBlock = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      for (const line of eventBlock.split("\n")) {
        const trimmed = line.replace(/^\uFEFF/, "").trimStart();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice("data:".length).trim();
        if (payload === "" ) continue;
        if (payload === "[DONE]") return;

        try {
          const obj = JSON.parse(payload) as { text?: string; delta?: string; content?: string };
          const text = obj.text ?? obj.delta ?? obj.content ?? "";
          if (text) onToken(text);
        } catch {
          // Non-JSON data line — emit the raw payload.
          onToken(payload);
        }
      }
    }
  }
}
