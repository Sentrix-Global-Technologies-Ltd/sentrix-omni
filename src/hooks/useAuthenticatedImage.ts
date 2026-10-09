import { useEffect, useRef, useState } from "react";
import { env } from "../config/env";
import { fetchAuthenticatedImageUrl } from "../services/api/authenticatedImage";

/**
 * The API path (relative to `env.apiBaseUrl`) of an absolute API URL the
 * backend handed out — e.g. `…/api/v1/organizations/{org}/vision-guard/
 * camera-sources/{id}/frame` → `organizations/{org}/…/frame`.
 *
 * Only paths under this app's own API version prefix are accepted, and the
 * request is always re-issued against `env.apiBaseUrl`: the bearer token is
 * never sent to whatever host the URL itself names (the backend builds it from
 * its own APP_URL, which need not match the dashboard's API origin).
 */
export function apiPathFromUrl(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url, env.apiBaseUrl).pathname;
  } catch {
    return null;
  }

  let prefix: string;
  try {
    prefix = new URL(env.apiBaseUrl).pathname.replace(/\/+$/, "");
  } catch {
    prefix = "/api/v1";
  }

  const marker = `${prefix}/`;
  const index = pathname.indexOf(marker);
  if (index === -1) return null;

  const path = pathname.slice(index + marker.length);
  return path.length > 0 ? path : null;
}

/**
 * Display a PRIVATE image the API serves only to an authenticated caller (an
 * `<img src>` cannot carry the bearer token). Fetches it with the token via
 * fetchAuthenticatedImageUrl and returns a blob object URL.
 *
 * `version` re-fetches when it changes (e.g. a camera's `last_frame_at`), the
 * previous image stays on screen until the new one has loaded, and every blob
 * URL is revoked once replaced or on unmount.
 */
export function useAuthenticatedImage(url: string | null | undefined, version?: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const current = useRef<string | null>(null);

  useEffect(() => {
    const path = url ? apiPathFromUrl(url) : null;

    if (!path) {
      if (current.current) URL.revokeObjectURL(current.current);
      current.current = null;
      setSrc(null);
      setStatus(url ? "error" : "idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetchAuthenticatedImageUrl(path)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        const previous = current.current;
        current.current = blobUrl;
        setSrc(blobUrl);
        setStatus("idle");
        if (previous) URL.revokeObjectURL(previous);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [url, version]);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
      current.current = null;
    },
    [],
  );

  return { src, status };
}
