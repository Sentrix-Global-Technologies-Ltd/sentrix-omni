import { useEffect, useRef, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageHeader from "../../../components/shared/PageHeader";
import Button from "../../../components/ui/button/Button";
import { useCoreChat } from "../hooks/useCoreChat";
import { MarkdownLite } from "../components/MarkdownLite";
import { ChatHistoryMenu } from "../components/ChatHistoryMenu";

const SUGGESTIONS = [
  "What's open right now?",
  "Summarize today's incidents",
  "Which responders are on duty?",
];

export default function AssistantPage() {
  const { messages, streaming, error, send, stop, reset, openThread } = useCoreChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = input;
    setInput("");
    void send(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <PageMeta title="Assistant | Sentrix Console" description="Sentrix AI command assistant" />
      <PageHeader
        title="Assistant"
        breadcrumbs={[{ label: "Assistant" }]}
        actions={
          <div className="flex items-center gap-2">
            <ChatHistoryMenu onSelectThread={openThread} />
            {messages.length > 0 ? (
              <Button size="sm" variant="outline" onClick={reset}>
                New chat
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Transcript */}
        <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask the Sentrix assistant about your operations.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-theme-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/90"
                  }`}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <MarkdownLite text={m.content || (streaming ? "…" : "")} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <p className="px-5 pb-1 text-theme-xs text-error-500">{error}</p>
        )}

        {/* Composer */}
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Message the assistant…  (Enter to send, Shift+Enter for a new line)"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            {streaming ? (
              <Button size="sm" variant="outline" onClick={stop}>
                Stop
              </Button>
            ) : (
              <Button size="sm" variant="primary" disabled={!input.trim()} onClick={submit}>
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
