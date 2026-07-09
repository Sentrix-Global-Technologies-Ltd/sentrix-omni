import { useEffect, useRef, useState } from "react";
import { reverbClient } from "./reverbClient";

type EventHandler = (event: string, payload: unknown) => void;

/**
 * Subscribe to a private org channel and forward the given events to `onEvent`.
 *
 * Realtime convention: one `use<Feature>Realtime` hook per feature wraps this,
 * passing only the channel name + event list. Returns `{ connected }` for a
 * RealtimeIndicator. Fully graceful: when Reverb is unconfigured/unavailable it
 * stays `connected: false` and does nothing. Backed by the native
 * {@see reverbClient} (no laravel-echo / pusher-js).
 */
export function useOrgChannel(
  channelName: string | null,
  events: string[],
  onEvent: EventHandler,
  options: { presence?: boolean } = {},
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const eventsKey = events.join(",");
  const presence = options.presence ?? false;

  // Track connection status for the indicator.
  useEffect(() => reverbClient.onStatus(setConnected), []);

  // Subscribe to the channel; filter to the events this feature cares about.
  useEffect(() => {
    if (!channelName) return;
    const allowed = new Set(eventsKey ? eventsKey.split(",") : []);
    const unsubscribe = reverbClient.subscribe(
      channelName,
      (event, data) => {
        if (allowed.has(event)) handlerRef.current(event, data);
      },
      { presence },
    );
    return unsubscribe;
  }, [channelName, eventsKey, presence]);

  return { connected };
}
