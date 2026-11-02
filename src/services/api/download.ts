/**
 * Authenticated file download.
 *
 * The JSON apiClient unwraps the `{ success, data }` envelope and can't handle
 * binary/CSV bodies, so file exports use this raw-fetch path instead: it attaches
 * the bearer token (+ `X-Organization` when scoped), reads the response as a Blob,
 * and triggers a browser download via a temporary object URL.
 */

import { env } from "../../config/env";
import { errorFromStatus, NetworkError, SAFE_MESSAGES } from "./errors";
import { tokenStorage } from "./tokenStorage";

type QueryValue = string | number | boolean | undefined | null;

interface DownloadOptions {
  query?: Record<string, QueryValue>;
  /** Tenant for the `X-Organization` header (org-scoped exports). */
  organizationId?: string | null;
  /** Override the filename; otherwise taken from Content-Disposition, else a default. */
  filename?: string;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${env.apiBaseUrl}/${path.replace(/^\/+/, "")}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(value);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function downloadFile(path: string, options: DownloadOptions = {}): Promise<void> {
  const { query, organizationId, filename } = options;

  const headers: Record<string, string> = { Accept: "*/*" };
  const token = tokenStorage.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (organizationId) headers["X-Organization"] = organizationId;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method: "GET", headers });
  } catch {
    throw new NetworkError(SAFE_MESSAGES.network, 0);
  }

  if (!response.ok) {
    throw errorFromStatus(response.status, "The export failed. Please try again.", {});
  }

  const blob = await response.blob();
  const name = filename ?? filenameFromDisposition(response.headers.get("Content-Disposition")) ?? "download";

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
