/**
 * Authenticated inline image fetch — companion to download.ts's
 * download-triggering path, for the opposite case: displaying an
 * authenticated file INLINE (e.g. an `<img>`) rather than saving it. Same
 * rationale as download.ts: the JSON apiClient unwraps the `{success, data}`
 * envelope and can't handle a binary body, so this fetches raw with the
 * bearer token attached and hands back a blob object URL. The caller owns
 * the returned URL's lifetime — revoke it with `URL.revokeObjectURL` once
 * it's no longer displayed (see useAuthenticatedImage, which does this on
 * unmount/change).
 */

import { env } from "../../config/env";
import { errorFromStatus, NetworkError, SAFE_MESSAGES } from "./errors";
import { tokenStorage } from "./tokenStorage";

export async function fetchAuthenticatedImageUrl(path: string): Promise<string> {
  const headers: Record<string, string> = { Accept: "image/*" };
  const token = tokenStorage.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}/${path.replace(/^\/+/, "")}`, { method: "GET", headers });
  } catch {
    throw new NetworkError(SAFE_MESSAGES.network, 0);
  }

  if (!response.ok) {
    throw errorFromStatus(response.status, "Could not load the image.", {});
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
