import { useState } from "react";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { TimeIcon, TrashBinIcon } from "../../../icons";
import { useChatThreads } from "../hooks/useChatThreads";
import type { ChatThreadDetail } from "../api/core.api";

/** Short, locale-agnostic "how long ago" — matches the compactness this
 *  history list is meant to have (no date library needed for this). */
function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Compact history list, opened from a single toggle button — deliberately a
 * dropdown, not a permanent sidebar, so the Assistant transcript stays the
 * whole page's focus rather than sharing it with a chat-list panel.
 */
export function ChatHistoryMenu({ onSelectThread }: { onSelectThread: (thread: ChatThreadDetail) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { threads, loading, error, refresh, openThread, archiveThread } = useChatThreads();

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) void refresh();
  };

  const handleSelect = async (threadId: string) => {
    const thread = await openThread(threadId);
    if (thread) {
      onSelectThread(thread);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="dropdown-toggle inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-theme-sm text-gray-700 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
      >
        <TimeIcon className="size-4" />
        History
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-h-96 w-80 overflow-y-auto p-2">
        {loading && <p className="px-3 py-2 text-theme-xs text-gray-400">Loading…</p>}

        {!loading && error && <p className="px-3 py-2 text-theme-xs text-error-500">{error}</p>}

        {!loading && !error && threads.length === 0 && (
          <p className="px-3 py-2 text-theme-xs text-gray-400">No past conversations yet.</p>
        )}

        {!loading &&
          threads.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-1 rounded-lg px-1 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <button
                type="button"
                onClick={() => void handleSelect(t.id)}
                className="min-w-0 flex-1 truncate px-2 py-2 text-left"
              >
                <span className="block truncate text-theme-sm text-gray-700 dark:text-gray-300">
                  {t.title || "New conversation"}
                </span>
                <span className="block text-theme-xs text-gray-400">{relativeTime(t.last_message_at)}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void archiveThread(t.id);
                }}
                title="Remove from history"
                className="rounded-md p-1.5 text-gray-400 opacity-0 hover:text-error-500 group-hover:opacity-100"
              >
                <TrashBinIcon className="size-4" />
              </button>
            </div>
          ))}
      </Dropdown>
    </div>
  );
}
