/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from "../config/env";
import { tokenStorage } from "../services/api/tokenStorage";

/**
 * Minimal native WebSocket client for the Pusher protocol that Laravel Reverb
 * speaks — no laravel-echo / pusher-js dependency.
 *
 * Scope: private organization channels only (all Sentrix channels are private).
 * Handles connect → connection_established (socket_id) → /broadcasting/auth
 * (bearer) → pusher:subscribe, plus ping/pong and exponential-backoff reconnect.
 * Fully graceful: if Reverb env is unset, every method is a no-op and status
 * stays disconnected.
 */

type EventHandler = (event: string, data: unknown) => void;
type StatusHandler = (connected: boolean) => void;

interface Subscription {
  /** Wire channel name, including the `private-` prefix. */
  channel: string;
  handlers: Set<EventHandler>;
  authed: boolean;
}

function safeParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class ReverbClient {
  private ws: WebSocket | null = null;
  private socketId: string | null = null;
  private connected = false;
  private intentionalClose = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly statusHandlers = new Set<StatusHandler>();

  private enabled(): boolean {
    return Boolean(env.reverb.key && env.reverb.host);
  }

  private url(): string {
    const proto = env.reverb.scheme === "https" ? "wss" : "ws";
    return `${proto}://${env.reverb.host}:${env.reverb.port}/app/${env.reverb.key}?protocol=7&client=sentrix&version=1.0`;
  }

  /**
   * Subscribe to an org channel (logical name, no prefix). Defaults to a private
   * channel; pass `{ presence: true }` for presence channels (e.g. responders).
   */
  subscribe(
    channelName: string,
    handler: EventHandler,
    options: { presence?: boolean } = {},
  ): () => void {
    if (!this.enabled()) return () => {};

    const channel = `${options.presence ? "presence-" : "private-"}${channelName}`;
    let sub = this.subscriptions.get(channel);
    if (!sub) {
      sub = { channel, handlers: new Set(), authed: false };
      this.subscriptions.set(channel, sub);
    }
    sub.handlers.add(handler);

    this.ensureConnection();
    if (this.connected && this.socketId && !sub.authed) {
      void this.authAndSubscribe(sub);
    }

    return () => {
      const current = this.subscriptions.get(channel);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(channel);
        this.send({ event: "pusher:unsubscribe", data: { channel } });
      }
    };
  }

  /** Subscribe to connection status; immediately invoked with current state. */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.connected);
    return () => this.statusHandlers.delete(handler);
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.socketId = null;
    this.subscriptions.clear();
    this.setConnected(false);
  }

  private setConnected(value: boolean): void {
    if (this.connected !== value) {
      this.connected = value;
      this.statusHandlers.forEach((h) => h(value));
    }
  }

  private ensureConnection(): void {
    if (!this.enabled()) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.intentionalClose = false;
    try {
      this.ws = new WebSocket(this.url());
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onmessage = (e) => this.onMessage(e);
    this.ws.onclose = () => {
      this.setConnected(false);
      this.socketId = null;
      this.subscriptions.forEach((s) => (s.authed = false));
      if (!this.intentionalClose) this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      /* a close event follows; reconnect handled there */
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.subscriptions.size === 0) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnection();
    }, delay);
  }

  private onMessage(e: MessageEvent): void {
    const msg = safeParse(e.data as string);
    if (!msg || typeof msg.event !== "string") return;

    const event: string = msg.event;
    const data = typeof msg.data === "string" ? safeParse(msg.data) : msg.data;

    if (event === "pusher:connection_established") {
      this.socketId = data?.socket_id ?? null;
      this.reconnectAttempts = 0;
      this.setConnected(true);
      this.subscriptions.forEach((sub) => void this.authAndSubscribe(sub));
      return;
    }
    if (event === "pusher:ping") {
      this.send({ event: "pusher:pong", data: {} });
      return;
    }
    if (event === "pusher:error" || event.startsWith("pusher_internal:")) {
      return; // subscription_succeeded / errors — no app handling needed
    }

    const channel: string | undefined = msg.channel;
    if (!channel) return;
    this.subscriptions.get(channel)?.handlers.forEach((h) => h(event, data));
  }

  private async authAndSubscribe(sub: Subscription): Promise<void> {
    if (!this.socketId || sub.authed) return;
    try {
      const token = tokenStorage.get();
      const res = await fetch(`${env.apiOrigin}/broadcasting/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          socket_id: this.socketId,
          channel_name: sub.channel,
        }),
      });
      if (!res.ok) return;
      const body = await res.json();
      this.send({
        event: "pusher:subscribe",
        data: { channel: sub.channel, auth: body.auth, channel_data: body.channel_data },
      });
      sub.authed = true;
    } catch {
      /* leave unauthed; a reconnect will retry */
    }
  }

  private send(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const reverbClient = new ReverbClient();
