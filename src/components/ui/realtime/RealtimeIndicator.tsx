/** Shared live/offline indicator for realtime-backed views. */
export default function RealtimeIndicator({ connected }: { connected: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-400"
      title={connected ? "Live updates connected" : "Live updates offline"}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-success-500" : "bg-gray-400"}`}
        />
      </span>
      {connected ? "Live" : "Offline"}
    </span>
  );
}
