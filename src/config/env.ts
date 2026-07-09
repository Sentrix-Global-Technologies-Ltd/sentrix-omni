/**
 * Runtime configuration for the Sentrix Console.
 *
 * The dashboard is a pure client of the Sentrix API and is deployed on a
 * separate origin, so the API base URL is injected at build time via Vite env
 * (`VITE_*`). See `.env.example`.
 */

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const rawDeviceName = import.meta.env.VITE_DEVICE_NAME as string | undefined;

const apiBaseUrl = (rawApiUrl ?? "http://localhost/api/v1").replace(/\/+$/, "");

/** Origin of the API (scheme + host), used for non-versioned endpoints like
 *  `/broadcasting/auth`. Falls back to the base URL if parsing fails. */
function deriveOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export const env = {
  /** Base URL of the Sentrix API, including the version segment (`/api/v1`). */
  apiBaseUrl,

  /** Scheme + host of the API (no path). */
  apiOrigin: deriveOrigin(apiBaseUrl),

  /**
   * Sent as `device_name` on login so the backend issues a Sanctum bearer
   * token (named per client) rather than a stateful SPA session.
   */
  deviceName: rawDeviceName ?? "Sentrix Console (web)",

  /** Reverb (Pusher-protocol) realtime config. Optional — realtime is a no-op
   *  if unset. Mirrors the backend's REVERB_* / VITE_REVERB_* values. */
  reverb: {
    key: (import.meta.env.VITE_REVERB_APP_KEY as string | undefined) ?? "",
    host: (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? "",
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    scheme: (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? "http",
  },
} as const;
